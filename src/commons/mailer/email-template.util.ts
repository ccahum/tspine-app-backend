// Plantilla base con el estilo de marca (mismos colores que el login del frontend) para todos
// los correos transaccionales — recuperación de contraseña, y a futuro CFDI/facturación.
// Todo el CSS va inline porque los clientes de correo no soportan hojas de estilo externas.
export function buildBrandedEmailHtml(params: { preheader?: string; bodyHtml: string; logoUrl?: string }): string {
  return `
    <!doctype html>
    <html lang="es">
      <head><meta charset="utf-8" /></head>
      <body style="margin:0; padding:0; background-color:#eeeee7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        ${params.preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${params.preheader}</div>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eeeee7; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:32px 36px 8px; text-align:center;">
                    ${params.logoUrl
                      ? `<img src="${params.logoUrl}" alt="Luminar" width="90" style="width:90px; max-width:100%; height:auto;" />`
                      : `<span style="font-size:1.15rem; font-weight:800; color:#16170f; letter-spacing:0.02em;">Luminar</span>`}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 36px 36px; color:#33342a; font-size:0.95rem; line-height:1.6;">
                    ${params.bodyHtml}
                  </td>
                </tr>
              </table>
              <p style="color:#8a8a7e; font-size:0.72rem; margin-top:20px;">© ${new Date().getFullYear()} Luminar</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function emailButtonHtml(url: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="border-radius:10px; background-color:#3f6510;">
          <a href="${url}" style="display:inline-block; padding:12px 24px; color:#ffffff; font-weight:700; font-size:0.9rem; text-decoration:none; border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}
