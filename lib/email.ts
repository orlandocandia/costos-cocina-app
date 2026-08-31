import nodemailer from "nodemailer";

/**
 * Cliente de correo SMTP.
 *
 * Variables de entorno:
 *   EMAIL_SERVER  → string de conexión SMTP.
 *                   Ej: "smtps://usuario:pass@smtp.gmail.com:465"
 *                   o "smtp://usuario:pass@smtp.mailtrap.io:587"
 *   EMAIL_FROM    → dirección remitente.
 *                   Ej: "Costos de Cocina <no-reply@tudominio.com>"
 *
 * Si EMAIL_SERVER no está definido, se entra en modo desarrollo: el enlace
 * de recuperación se loguea a consola en lugar de enviarse por mail (útil
 * para probar el flujo sin servidor SMTP configurado).
 */
function getTransport() {
  const connectionString = process.env.EMAIL_SERVER;
  if (!connectionString) {
    return null; // modo dev
  }
  return nodemailer.createTransport(connectionString);
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Envía un correo. Devuelve `true` si se envió y `false` si cayó en modo dev.
 */
export async function sendMail({
  to,
  subject,
  text,
  html,
}: SendMailInput): Promise<{ sent: boolean; devPreviewUrl?: string }> {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM ?? "no-reply@costos-cocina.local";

  if (!transport) {
    // Modo desarrollo: loguear en lugar de enviar.
    console.warn(
      "[email] EMAIL_SERVER no configurado. Simulando envío (modo dev):",
      { from, to, subject, text },
    );
    return { sent: false, devPreviewUrl: text };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

/**
 * Envía el correo de recuperación de contraseña con el enlace de reset.
 */
export async function sendPasswordRecoveryEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const subject = "Recuperación de contraseña · Costos de Cocina";
  const text =
    `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
    `Ingresá al siguiente enlace para elegir una nueva (vence en 15 minutos):\n\n` +
    `${resetUrl}\n\n` +
    `Si no fuiste vos, ignorá este correo y tu contraseña no cambiará.`;
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #047857;">Recuperación de contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Hacé clic en el botón para elegir una nueva (el enlace vence en 15 minutos):</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background: #047857; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Restablecer contraseña</a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">Si no podés hacer clic, copiá este enlace: <br>${resetUrl}</p>
      <p style="color: #6b7280; font-size: 13px;">Si no fuiste vos, ignorá este correo y tu contraseña no cambiará.</p>
    </div>`;
  await sendMail({ to, subject, text, html });
}
