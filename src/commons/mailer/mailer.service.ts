import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !this.fromEmail) {
      this.logger.warn('RESEND_API_KEY / RESEND_FROM_EMAIL no configuradas — el envío de correos no funcionará');
      this.resend = null;
      return;
    }
    this.resend = new Resend(apiKey);
  }

  async enviarCorreo(params: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.resend || !this.fromEmail) {
      throw new InternalServerErrorException('Servicio de correo no configurado en este ambiente');
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      this.logger.error(`Error enviando correo a ${params.to}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
  }
}
