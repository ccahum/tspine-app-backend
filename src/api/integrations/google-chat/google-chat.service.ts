import { Readable } from 'node:stream';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '@app/prisma/prisma.service';

// Mismas sedes que la condición "Jalisco" del bot original en AppSheet (EnviarCotizaAlChat):
// or([SEDE].[NOMBRE COMPLETO]="Sede Guadalajara",[SEDE].[NOMBRE COMPLETO]="Sede Vallarta").
const SEDES_GDL = new Set(['Sede Guadalajara', 'Sede Vallarta']);

// Límite documentado de la Chat API para el texto de un mensaje.
const MAX_MESSAGE_TEXT_LENGTH = 4096;
// Recorte defensivo por campo para no acercarse a ese límite con textos largos de Consumo/Observaciones.
const MAX_FIELD_LENGTH = 1500;

const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may', 'jun', 'jul', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

function formatFechaQx(fecha: Date | null): string {
  if (!fecha) return '-';
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const mes = MESES[fecha.getUTCMonth()];
  const anio = String(fecha.getUTCFullYear()).slice(-2);
  return `${dia}/${mes}/${anio}`;
}

function truncar(texto: string | null): string {
  if (!texto) return '-';
  return texto.length > MAX_FIELD_LENGTH ? `${texto.slice(0, MAX_FIELD_LENGTH)}…` : texto;
}

@Injectable()
export class GoogleChatService {
  private readonly logger = new Logger(GoogleChatService.name);
  private readonly auth: InstanceType<typeof google.auth.GoogleAuth> | null;
  private readonly spaceGdl: string | undefined;
  private readonly spaceYucatan: string | undefined;

  constructor(private readonly prisma: PrismaService) {
    this.spaceGdl = process.env.GOOGLE_CHAT_SPACE_GDL;
    this.spaceYucatan = process.env.GOOGLE_CHAT_SPACE_YUCATAN;

    const keyBase64 = process.env.GOOGLE_CHAT_SA_KEY_BASE64;
    if (!keyBase64) {
      this.logger.warn('GOOGLE_CHAT_SA_KEY_BASE64 no configurada — el envío a Google Chat no funcionará');
      this.auth = null;
      return;
    }
    const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'));
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/chat.bot'],
    });
  }

  async sendProgramacionPdf(programacionId: string, file: Express.Multer.File): Promise<void> {
    if (!this.auth || !this.spaceGdl || !this.spaceYucatan) {
      throw new InternalServerErrorException('Integración de Google Chat no configurada en este ambiente');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const programacion = await this.prisma.programacion.findUnique({
      where: { id: programacionId },
      select: {
        id: true,
        numProgram: true,
        fechaQx: true,
        horaQx: true,
        consumo: true,
        observaciones: true,
        sede: { select: { nombre: true } },
        hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
        medicos: { select: { medico: { select: { nombreCompleto: true } } } },
      },
    });
    if (!programacion) throw new NotFoundException('Programación no encontrada');

    const spaceId = SEDES_GDL.has(programacion.sede?.nombre ?? '') ? this.spaceGdl : this.spaceYucatan;
    const medicos = programacion.medicos.map(m => m.medico.nombreCompleto).join(', ') || '-';

    const text = [
      '📢 Se anexa información de la siguiente programación quirúrgica:',
      '',
      `🔢 N° Programa: ${programacion.numProgram ?? programacion.id}`,
      `📅 Fecha Qx: ${formatFechaQx(programacion.fechaQx)}`,
      `⏰ Hora Qx: ${programacion.horaQx ?? '-'}`,
      `🌍 Ciudad Qx: ${programacion.hospital?.ciudadCat?.nombre ?? '-'}`,
      `👨‍⚕️ Médico: ${medicos}`,
      `🏥 Hospital: ${programacion.hospital?.nombre ?? '-'}`,
      `💊 Consumo: ${truncar(programacion.consumo)}`,
      `📝 Observaciones: ${truncar(programacion.observaciones)}`,
    ].join('\n').slice(0, MAX_MESSAGE_TEXT_LENGTH);

    const chat = google.chat({ version: 'v1', auth: this.auth });

    const uploadRes = await chat.media.upload({
      parent: spaceId,
      requestBody: { filename: file.originalname },
      media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
    });

    await chat.spaces.messages.create({
      parent: spaceId,
      requestBody: {
        text,
        attachment: [{ attachmentDataRef: uploadRes.data.attachmentDataRef }],
      },
    });
  }
}
