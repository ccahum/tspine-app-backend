import { createReadStream, statSync } from 'node:fs';
import { Body, Controller, Get, Param, Post, Req, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '@app/commons/decorators/public.decorator';
import { resolveUploadPath, uploadFileExists } from '@app/commons/file-storage.utils';
import { GoogleChatService } from './google-chat.service';

const COTIZACION_TTL_MS = 24 * 60 * 60 * 1000;

function buildExpiradoHtml(): string {
  return `
    <!doctype html>
    <html lang="es">
      <head><meta charset="utf-8" /><title>Cotización no disponible</title></head>
      <body style="margin:0; padding:0; background-color:#eeeee7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
        <div style="background:#fff; border-radius:16px; padding:2.5rem 2.25rem; max-width:420px; text-align:center; box-shadow:0 12px 40px rgba(0,0,0,0.08);">
          <span style="font-size:1.15rem; font-weight:800; color:#16170f;">Luminar</span>
          <h1 style="font-size:1.15rem; color:#16170f; margin:1.25rem 0 0.5rem;">Este PDF ya no está disponible</h1>
          <p style="font-size:0.9rem; color:#8a8a7e; line-height:1.5; margin:0;">
            El link expiró después de 24 horas. Pide que te reenvíen la programación desde Luminar si necesitas verlo de nuevo.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Endpoint de eventos requerido por la configuración de la Chat App en Google Cloud
 * ("Configuración de conexión" → "URL del extremo HTTP"). La app de Luminar solo ENVÍA
 * mensajes/archivos vía la API (autenticada como app con cuenta de servicio) — no necesita
 * responder a mensajes de usuarios, así que este endpoint únicamente reconoce el evento.
 */
@ApiTags('Integraciones - Google Chat')
@Controller('integraciones/google-chat')
export class GoogleChatController {
  constructor(private readonly googleChatService: GoogleChatService) {}

  @Public()
  @Post('events')
  @ApiOperation({ summary: 'Recibe eventos de Google Chat (requerido por la configuración de la app; no se procesan)' })
  handleEvent(@Body() _body: unknown) {
    return {};
  }

  @Post('send-programacion')
  @ApiOperation({ summary: 'Envía la información de una programación al espacio de Chat correspondiente (GDL/Vallarta o Yucatán); el PDF de cotización es opcional' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async sendProgramacion(
    @Body('programacionId') programacionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const user = req['user'] as { sub: string };
    await this.googleChatService.sendProgramacionPdf(programacionId, file, user.sub);
    return { success: true };
  }

  // Público a propósito: el botón "Ver cotización" de la card se abre desde Google Chat/Gmail,
  // que no puede mandar el token de sesión de Luminar. El id es un UUID no adivinable, mismo
  // modelo de seguridad que el resto de los archivos en uploads/. Vencido a las 24h (ver
  // GoogleChatService.limpiarCotizacionesVencidas) — aquí se revisa la edad también, por si el
  // barrido cada hora todavía no pasó por ese archivo puntual.
  @Public()
  @Get('cotizacion/:id')
  @ApiOperation({ summary: 'Descarga la cotización PDF enviada a Chat (link usado desde la card, sin autenticación)' })
  getCotizacion(@Param('id') id: string, @Res({ passthrough: true }) res: Response): StreamableFile | void {
    const relativePath = `cotizaciones-chat/${id}.pdf`;
    const absolutePath = uploadFileExists(relativePath) ? resolveUploadPath(relativePath) : null;
    const vencido = absolutePath && Date.now() - statSync(absolutePath).mtimeMs > COTIZACION_TTL_MS;

    if (!absolutePath || vencido) {
      res.status(404).type('html').send(buildExpiradoHtml());
      return;
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Cotizacion-${id}.pdf"`,
    });
    return new StreamableFile(createReadStream(absolutePath));
  }
}
