import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/commons/decorators/public.decorator';
import { GoogleChatService } from './google-chat.service';

/**
 * Endpoint de eventos requerido por la configuración de la Chat App en Google Cloud
 * ("Configuración de conexión" → "URL del extremo HTTP"). La app de TSpine solo ENVÍA
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
  @ApiOperation({ summary: 'Envía el PDF de una programación al espacio de Chat correspondiente (GDL/Vallarta o Yucatán)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async sendProgramacion(@Body('programacionId') programacionId: string, @UploadedFile() file: Express.Multer.File) {
    await this.googleChatService.sendProgramacionPdf(programacionId, file);
    return { success: true };
  }
}
