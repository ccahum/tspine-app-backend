import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/commons/decorators/public.decorator';

/**
 * Endpoint de eventos requerido por la configuración de la Chat App en Google Cloud
 * ("Configuración de conexión" → "URL del extremo HTTP"). La app de TSpine solo ENVÍA
 * mensajes/archivos vía la API (autenticada como app con cuenta de servicio) — no necesita
 * responder a mensajes de usuarios, así que este endpoint únicamente reconoce el evento.
 */
@ApiTags('Integraciones - Google Chat')
@Controller('integraciones/google-chat')
export class GoogleChatController {
  @Public()
  @Post('events')
  @ApiOperation({ summary: 'Recibe eventos de Google Chat (requerido por la configuración de la app; no se procesan)' })
  handleEvent(@Body() _body: unknown) {
    return {};
  }
}
