import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "Librería Benticuaga <onboarding@resend.dev>"

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 8px;">Restablecer contraseña</h2>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
        Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para continuar.
      </p>
      <a href="${resetLink}"
         style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none;
                padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Restablecer contraseña
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        Si no solicitaste esto, ignorá este mensaje. El link expira en 1 hora.
      </p>
    </div>
  `
  await sendEmail(email, "Restablecer contraseña — Benticuaga", html)
}

export interface EmailAttachment {
  filename: string
  content: Buffer
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    })
    if (error) {
      console.error("[Email] Send error:", error)
      return false
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Email] Sent to ${to}: ${subject}`)
      // Loggear el contenido HTML en desarrollo para ver el link si Resend falla
      console.log(`[Email] Body: \n`, html)
    }
    return true
  } catch (err) {
    console.error("[Email] Unexpected error:", err)
    return false
  }
}
