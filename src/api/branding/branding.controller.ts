import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@app/commons/decorators/public.decorator';

// Sirve el ícono de la marca en una URL pública y estable, sin autenticación — lo consumen
// servicios externos (ej. Authy descarga esta imagen para mostrarla junto al código TOTP en el
// QR de 2FA), que no pueden pasar por el login/JWT de la app.
@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  @Public()
  @Get('icon.png')
  @ApiOperation({ summary: 'Ícono de la marca (usado como imagen del QR de 2FA)' })
  // El ícono casi nunca cambia — con esto, quien ya lo descargó una vez (Authy, un navegador)
  // no vuelve a pedirlo hasta dentro de 7 días, reduciendo la superficie de abuso de este
  // endpoint público sin necesidad de un rate-limiter.
  @Header('Cache-Control', 'public, max-age=604800, immutable')
  getIcon(): StreamableFile {
    const filePath = join(process.cwd(), 'public', 'luminar-icon.png');
    return new StreamableFile(createReadStream(filePath), { type: 'image/png' });
  }
}
