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
  // A diferencia de `auth` (el service account actuando como sí mismo, para postear en espacios
  // fijos), esto impersona a un admin del Workspace (GOOGLE_WORKSPACE_ADMIN_EMAIL) vía Domain-Wide
  // Delegation, solo para leer el directorio (scope admin.directory.user.readonly) — nunca para
  // mandar nada en su nombre.
  private readonly directoryAuth: InstanceType<typeof google.auth.JWT> | null;
  private readonly spaceGdl: string | undefined;
  private readonly spaceYucatan: string | undefined;

  constructor(private readonly prisma: PrismaService) {
    this.spaceGdl = process.env.GOOGLE_CHAT_SPACE_GDL;
    this.spaceYucatan = process.env.GOOGLE_CHAT_SPACE_YUCATAN;

    const keyBase64 = process.env.GOOGLE_CHAT_SA_KEY_BASE64;
    if (!keyBase64) {
      this.logger.warn('GOOGLE_CHAT_SA_KEY_BASE64 no configurada — el envío a Google Chat no funcionará');
      this.auth = null;
      this.directoryAuth = null;
    } else {
      const credentials = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'));
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/chat.bot'],
      });

      const adminEmail = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL;
      if (!adminEmail) {
        this.logger.warn('GOOGLE_WORKSPACE_ADMIN_EMAIL no configurada — la búsqueda en el directorio no funcionará');
        this.directoryAuth = null;
      } else {
        this.directoryAuth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
          subject: adminEmail,
        });
      }
    }

    this.limpiarCotizacionesVencidas();
    setInterval(() => this.limpiarCotizacionesVencidas(), CLEANUP_INTERVAL_MS).unref();
  }

  // Usuarios del directorio de Workspace que hagan match con el término buscado — para elegir a
  // quién mandarle una cotización por Chat directo. Se limpian los caracteres que rompen la
  // sintaxis de búsqueda de la Admin SDK (":"/""") en vez de escaparlos, porque acá es solo un
  // término suelto, no hace falta soportarlos. La Admin SDK no soporta "OR" entre campos ni un
  // campo "name" combinado (ambos probados, ambos rechazados por la API) — así que se hacen
  // consultas separadas por campo válido (givenName/familyName, o email si el término trae "@")
  // y se juntan los resultados sin duplicados.
  async buscarDirectorio(query: string): Promise<{ nombre: string; correo: string; id: string }[]> {
    if (!this.directoryAuth) {
      throw new InternalServerErrorException('Directorio de Google Workspace no configurado en este ambiente');
    }
    const termino = query.trim().replace(/[":]/g, '');
    if (!termino) return [];

    const admin = google.admin({ version: 'directory_v1', auth: this.directoryAuth });
    const consultas = termino.includes('@')
      ? [`email:${termino}*`]
      : [`givenName:${termino}*`, `familyName:${termino}*`];

    const resultados = await Promise.all(
      consultas.map(q => admin.users.list({ customer: 'my_customer', query: q, maxResults: 10, orderBy: 'givenName' }).then(r => r.data.users ?? [])),
    );

    const vistos = new Set<string>();
    // El id numérico del directorio (no el correo) es lo que se usa después para abrir el DM —
    // spaces.findDirectMessage con auth de app rechaza correos que sean alias ("Service account
    // authentication doesn't support access to user information using email aliases"), pero el id
    // no tiene ese problema.
    const usuarios: { nombre: string; correo: string; id: string }[] = [];
    for (const lista of resultados) {
      for (const u of lista) {
        const correo = u.primaryEmail;
        const id = u.id;
        if (!correo || !id || vistos.has(correo)) continue;
        vistos.add(correo);
        usuarios.push({ nombre: u.name?.fullName ?? correo, correo, id });
      }
    }
    return usuarios.slice(0, 10);
  }

  // Envía el PDF de una cotización por mensaje directo (DM) de Chat a una persona específica del
  // directorio — mismo mecanismo de card que sendProgramacionPdf, pero el destino es un DM
  // resuelto/creado con spaces.setup en vez de uno de los dos espacios fijos por sede.
  async sendCotizacionDm(params: {
    cotizacionId: string;
    destinatarioId: string;
    numCotizacion: string;
    hospital: string;
    medico: string;
    cirugia: string;
    total: string;
    file: Express.Multer.File;
    usuarioId?: string;
  }): Promise<void> {
    if (!this.auth) {
      throw new InternalServerErrorException('Integración de Google Chat no configurada en este ambiente');
    }
    if (!params.destinatarioId) {
      throw new BadRequestException('Falta el destinatario');
    }
    if (params.file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const enviadoPor = params.usuarioId
      ? await this.prisma.tercero.findUnique({ where: { id: params.usuarioId }, select: { nombreCompleto: true } })
      : null;

    const archivoId = randomUUID();
    saveUploadFile(COTIZACIONES_CHAT_SUBDIR, `${archivoId}.pdf`, params.file.buffer);
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const cotizacionUrl = `${backendUrl}/integraciones/google-chat/cotizacion/${archivoId}`;

    const chat = google.chat({ version: 'v1', auth: this.auth });

    // spaces.setup (crear/abrir un DM) requiere autenticación de usuario, no de app — un bot no
    // puede iniciar un DM en frío con alguien. findDirectMessage sí funciona con auth de app, pero
    // solo encuentra un DM que YA existe: existe automáticamente para todos si la app de Chat está
    // instalada para toda la organización (ver decisión del 2026-09-25, PENDIENTE de que se
    // publique/instale así — hasta entonces esto da 404 para cualquier destinatario).
    let spaceName: string | null | undefined;
    try {
      const found = await chat.spaces.findDirectMessage({ name: `users/${params.destinatarioId}` });
      spaceName = found.data.name;
    } catch (err) {
      const status = (err as { code?: number })?.code;
      if (status === 404) {
        throw new BadRequestException('No se encontró un mensaje directo con esa persona en Google Chat. Puede que la app de Chat todavía no esté instalada para toda la organización, o que esa persona no la tenga habilitada.');
      }
      throw err;
    }
    if (!spaceName) throw new InternalServerErrorException('No se pudo encontrar el mensaje directo en Google Chat');

    await chat.spaces.messages.create({
      parent: spaceName,
      requestBody: {
        cardsV2: [{
          cardId: `cotizacion-${params.cotizacionId}`,
          card: {
            header: {
              title: 'Cotización',
              subtitle: params.numCotizacion,
              imageUrl: `${backendUrl}/integraciones/google-chat/icon`,
              imageType: 'CIRCLE',
              imageAltText: 'Luminar',
            },
            sections: [
              {
                widgets: [
                  { decoratedText: { startIcon: { knownIcon: 'STORE' }, topLabel: labelVerde('Hospital'), text: params.hospital, wrapText: true } },
                  { decoratedText: { startIcon: { knownIcon: 'PERSON' }, topLabel: labelVerde('Médico'), text: params.medico, wrapText: true } },
                  { decoratedText: { startIcon: { knownIcon: 'DESCRIPTION' }, topLabel: labelVerde('Cirugía'), text: params.cirugia, wrapText: true } },
                  { decoratedText: { startIcon: { knownIcon: 'DOLLAR' }, topLabel: labelVerde('Total'), text: params.total } },
                ],
              },
              {
                widgets: [
                  {
                    buttonList: {
                      buttons: [
                        { text: 'Ver cotización', onClick: { openLink: { url: cotizacionUrl } }, color: { red: 0.247, green: 0.396, blue: 0.063, alpha: 1 } },
                        { text: 'Abrir en Luminar', onClick: { openLink: { url: `${frontendUrl}/operacion/cotizaciones/${params.cotizacionId}` } }, color: { red: 0.247, green: 0.396, blue: 0.063, alpha: 1 } },
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
              title: 'Programación',
              subtitle: `${numProgramLabel}`,
              imageUrl: `${backendUrl}/integraciones/google-chat/icon`,
              imageType: 'CIRCLE',
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
