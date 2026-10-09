import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

async function getTransporter() {
  if (env.SMTP_HOST && env.SMTP_USER) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }

  // Fallback: Ethereal preview transport for development
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return transporter;
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  try {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'FleetFlow — Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your FleetFlow password.</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">
            If you did not request this, you can safely ignore this email.<br/>
            This link will expire in 1 hour and can only be used once.
          </p>
        </div>
      `,
    });

    if (nodemailer.getTestMessageUrl(info)) {
      logger.info('Password reset email preview:', { url: nodemailer.getTestMessageUrl(info) });
    }
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err });
  }
}
