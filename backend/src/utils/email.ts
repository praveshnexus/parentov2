
import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const isEmailConfigured = Boolean(
  config.SMTP_HOST &&
  config.SMTP_PORT &&
  config.SMTP_USER &&
  config.SMTP_PASS &&
  config.EMAIL_FROM
);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT!,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })
  : null;

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> => {
  if (!transporter) {
    const message = 'SMTP is not configured. Email cannot be sent.';
    logger.error(message);
    throw new Error(message);
  }

  try {
    const result = await transporter.sendMail({
      from: config.EMAIL_FROM!,
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: result.messageId,
      response: result.response,
    });
  } catch (error) {
    logger.error('SMTP email delivery failed', {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};

export const emailTemplates = {
  verifyEmail: (name: string, token: string): string => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h1 style="color: #6366f1;">Welcome to Parento! 👶</h1>
        <p>Hi ${name},</p>
        <p>Please verify your email address to get started.</p>
        <a href="${config.CLIENT_URL}/verify-email?token=${token}"
           style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
          Verify Email
        </a>
        <p style="color: #9ca3af; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    </body>
    </html>
  `,

  resetPassword: (name: string, token: string): string => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h1 style="color: #6366f1;">Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password.</p>
        <a href="${config.CLIENT_URL}/reset-password?token=${token}"
           style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
          Reset Password
        </a>
        <p style="color: #9ca3af; font-size: 14px;">This link expires in 1 hour.</p>
      </div>
    </body>
    </html>
  `,

  appointmentConfirmed: (
    name: string,
    doctorName: string,
    date: string
  ): string => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e;">Appointment Confirmed! ✅</h1>
        <p>Hi ${name},</p>
        <p>Your appointment with <strong>${doctorName}</strong> has been confirmed.</p>
        <p><strong>Date & Time:</strong> ${date}</p>
        <a href="${config.CLIENT_URL}/appointments"
           style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
          View Appointment
        </a>
      </div>
    </body>
    </html>
  `,
};
