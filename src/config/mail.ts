import nodemailer from 'nodemailer';
import { ENV } from './env.js';

export const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: ENV.SMTP_USER ? {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  } : undefined,
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> => {
  try {
    if (!ENV.SMTP_USER) {
      console.log(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
      if (options.text) console.log(`[Email Mock Text]: ${options.text}`);
      return;
    }
    await transporter.sendMail({
      from: `"${ENV.EMAIL_FROM}" <${ENV.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (error) {
    console.error('[Email Error] Failed to send email:', error);
  }
};
