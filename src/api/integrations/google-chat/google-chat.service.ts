import { randomUUID } from 'node:crypto';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '@app/prisma/prisma.service';
import { saveUploadFile, UPLOADS_ROOT } from '@app/commons/file-storage.utils';

// Mismas sedes que la condición "Jalisco" del bot original en AppSheet (EnviarCotizaAlChat):
// or([SEDE].[NOMBRE COMPLETO]="Sede Guadalajara",[SEDE].[NOMBRE COMPLETO]="Sede Vallarta").
const SEDES_GDL = new Set(['Sede Guadalajara', 'Sede Vallarta']);

// Recorte defensivo por campo para no acercarse al límite de una card (Consumo/Observaciones
// pueden venir muy largos en datos legacy).
const MAX_FIELD_LENGTH = 1500;

const COTIZACIONES_CHAT_SUBDIR = 'cotizaciones-chat';
const COTIZACION_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const VERDE_MARCA = '#3f6510';

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

// Card text/decoratedText soportan un subconjunto chico de HTML — esto tinta el label de verde
// de marca sin afectar el valor (que se queda en el color default para mantener contraste/lectura).
function labelVerde(texto: string): string {
  return `<font color="${VERDE_MARCA}"><b>${texto}</b></font>`;
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
    } else {
      const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'));
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/chat.bot'],
      });
    }

    this.limpiarCotizacionesVencidas();
    setInterval(() => this.limpiarCotizacionesVencidas(), CLEANUP_INTERVAL_MS).unref();
  }

  // Las cotizaciones mandadas a Chat solo viven 24h en el servidor — pasado ese tiempo el link
  // "Ver cotización" ya no sirve (ver GoogleChatController.getCotizacion). No hay razón de
  // negocio para conservarlas más tiempo: es solo para que el chat las pueda abrir al momento.
  private limpiarCotizacionesVencidas(): void {
    const dir = join(UPLOADS_ROOT, COTIZACIONES_CHAT_SUBDIR);
    let archivos: string[];
    try {
      archivos = readdirSync(dir);
    } catch {
      return; // la carpeta todavía no existe — nada que limpiar
    }

    const ahora = Date.now();
    let eliminados = 0;
    for (const archivo of archivos) {
      const rutaCompleta = join(dir, archivo);
      try {
        const stat = statSync(rutaCompleta);
        if (ahora - stat.mtimeMs > COTIZACION_TTL_MS) {
          unlinkSync(rutaCompleta);
          eliminados++;
        }
      } catch {
        // el archivo pudo haberse borrado entre el readdir y el stat — se ignora
      }
    }
    if (eliminados > 0) {
      this.logger.log(`Limpieza de cotizaciones-chat: ${eliminados} archivo(s) vencido(s) eliminado(s)`);
    }
  }

  async sendProgramacionPdf(programacionId: string, file: Express.Multer.File | undefined, usuarioId: string): Promise<void> {
    if (!this.auth || !this.spaceGdl || !this.spaceYucatan) {
      throw new InternalServerErrorException('Integración de Google Chat no configurada en este ambiente');
    }
    if (file && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const [programacion, enviadoPor] = await Promise.all([
      this.prisma.programacion.findUnique({
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
          tecnicos: { select: { tecnico: { select: { nombreCompleto: true } } } },
        },
      }),
      this.prisma.tercero.findUnique({ where: { id: usuarioId }, select: { nombreCompleto: true } }),
    ]);
    if (!programacion) throw new NotFoundException('Programación no encontrada');

    const spaceId = SEDES_GDL.has(programacion.sede?.nombre ?? '') ? this.spaceGdl : this.spaceYucatan;
    const medicos = programacion.medicos.map(m => m.medico.nombreCompleto).join(', ') || '-';
    const tecnicos = programacion.tecnicos.map(t => t.tecnico.nombreCompleto).join(', ') || '-';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const numProgramLabel = programacion.numProgram ?? programacion.id;

    let cotizacionUrl: string | null = null;
    if (file) {
      const cotizacionId = randomUUID();
      saveUploadFile(COTIZACIONES_CHAT_SUBDIR, `${cotizacionId}.pdf`, file.buffer);
      cotizacionUrl = `${backendUrl}/integraciones/google-chat/cotizacion/${cotizacionId}`;
    }

    const chat = google.chat({ version: 'v1', auth: this.auth });

    await chat.spaces.messages.create({
      parent: spaceId,
      requestBody: {
        cardsV2: [{
          cardId: `programacion-${programacion.id}`,
          card: {
            header: {
              title: `Programación ${numProgramLabel}`,
              subtitle: 'Anexo de información',
              imageUrl: `${frontendUrl}/favicon.png`,
              imageType: 'SQUARE',
              imageAltText: 'Luminar',
            },
            sections: [
              {
                widgets: [
                  { decoratedText: { startIcon: { knownIcon: 'CLOCK' }, topLabel: labelVerde('Fecha y hora Qx'), text: `${formatFechaQx(programacion.fechaQx)} · ${programacion.horaQx ?? '-'}` } },
                  { decoratedText: { startIcon: { knownIcon: 'MAP_PIN' }, topLabel: labelVerde('Ciudad Qx'), text: programacion.hospital?.ciudadCat?.nombre ?? '-' } },
                  { decoratedText: { startIcon: { knownIcon: 'PERSON' }, topLabel: labelVerde('Médico'), text: medicos, wrapText: true } },
                  { decoratedText: { startIcon: { knownIcon: 'MULTIPLE_PEOPLE' }, topLabel: labelVerde('Técnicos'), text: tecnicos, wrapText: true } },
                  { decoratedText: { startIcon: { knownIcon: 'STORE' }, topLabel: labelVerde('Hospital'), text: programacion.hospital?.nombre ?? '-', wrapText: true } },
                ],
              },
              {
                header: 'Consumo',
                widgets: [{ textParagraph: { text: truncar(programacion.consumo) } }],
              },
              {
                header: 'Observaciones',
                widgets: [{ textParagraph: { text: truncar(programacion.observaciones) } }],
              },
              {
                widgets: [
                  {
                    buttonList: {
                      buttons: [
                        ...(cotizacionUrl
                          ? [{
                              text: 'Ver cotización',
                              onClick: { openLink: { url: cotizacionUrl } },
                              color: { red: 0.247, green: 0.396, blue: 0.063, alpha: 1 },
                            }]
                          : []),
                        { text: 'Abrir en Luminar', onClick: { openLink: { url: `${frontendUrl}/operacion/programaciones/${programacion.id}` } }, color: { red: 0.247, green: 0.396, blue: 0.063, alpha: 1 } },
                      ],
                    },
                  },
                  { decoratedText: { text: `<i>Enviado por ${enviadoPor?.nombreCompleto ?? '-'}</i>` } },
                ],
              },
            ],
          },
        }],
      },
    });
  }
}
