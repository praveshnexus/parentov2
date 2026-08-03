import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
  logger.error('Email send error:', error);

  if (config.NODE_ENV === 'development') {
    logger.warn('Skipping email in development mode.');
    return;
  }

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
        <h1 style="color: #6366f1; margin-bottom: 8px;">Welcome to Parento! 👶</h1>
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Please verify your email address to get started.</p>
        <a href="${config.CLIENT_URL}/verify-email?token=${token}"
           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #ec4899); color: white;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #9ca3af; font-size: 14px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
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
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">We received a request to reset your password.</p>
        <a href="${config.CLIENT_URL}/reset-password?token=${token}"
           style="display: inline-block; background: linear-gradient(135deg, #6366f1, #ec4899); color: white;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #9ca3af; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </body>
    </html>
  `,

  appointmentConfirmed: (name: string, doctorName: string, date: string): string => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h1 style="color: #22c55e;">Appointment Confirmed! ✅</h1>
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Your appointment with <strong>${doctorName}</strong> has been confirmed.</p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #16a34a; margin: 0;"><strong>Date & Time:</strong> ${date}</p>
        </div>
        <a href="${config.CLIENT_URL}/appointments"
           style="display: inline-block; background: #22c55e; color: white;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Appointment
        </a>
      </div>
    </body>
    </html>
  `,
};
