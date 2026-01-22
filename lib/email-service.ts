import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using Resend or SendGrid (Resend preferred)
 * Automatically detects which service is configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from } = options;

  const resendKey = process.env.RESEND_KEY;
  const sendGridKey = process.env.AUTH_SENDGRID_KEY;
  const emailFrom = from || process.env.EMAIL_FROM || 'noreply@nutrient.io';

  // Prefer Resend if configured
  if (resendKey) {
    return sendEmailViaResend({ to, subject, html, from: emailFrom }, resendKey);
  }

  // Fall back to SendGrid
  if (sendGridKey) {
    return sendEmailViaSendGrid({ to, subject, html, from: emailFrom }, sendGridKey);
  }

  logger.warn('No email service configured - email not sent', { to, subject });
  return false;
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(
  options: EmailOptions & { from: string },
  apiKey: string,
): Promise<boolean> {
  const { to, subject, html, from } = options;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Resend API error', new Error(errorText));
      return false;
    }

    const result = await response.json();
    logger.info('Email sent successfully via Resend', { to, subject, emailId: result.id });
    return true;
  } catch (error) {
    logger.error('Error sending email via Resend', error);
    return false;
  }
}

/**
 * Send email via SendGrid API
 */
async function sendEmailViaSendGrid(
  options: EmailOptions & { from: string },
  apiKey: string,
): Promise<boolean> {
  const { to, subject, html, from } = options;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject,
          },
        ],
        from: { email: from },
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('SendGrid API error', new Error(errorText));
      return false;
    }

    logger.info('Email sent successfully via SendGrid', { to, subject });
    return true;
  } catch (error) {
    logger.error('Error sending email via SendGrid', error);
    return false;
  }
}

/**
 * Generate email HTML for document cancellation notification
 */
export function generateCancellationEmail(params: {
  recipientName: string;
  senderName: string;
  documentName: string;
  reason?: string;
  dashboardUrl: string;
}): string {
  const { recipientName, senderName, documentName, reason, dashboardUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Nutrient Sign</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Document Cancelled</h2>

          <p>Hi ${recipientName},</p>

          <p>The following document has been cancelled by <strong>${senderName}</strong> and no longer requires your signature:</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${documentName}</p>
          </div>

          ${reason ? `<p style="background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #ccc;"><strong>Reason:</strong> ${reason}</p>` : ''}

          <p style="color: #666;">No further action is required from you regarding this document.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Your Inbox
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from Nutrient Sign. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate email HTML for document signing request
 */
export function generateSigningEmail(params: {
  recipientName: string;
  senderName: string;
  documentName: string;
  signingUrl: string;
  message?: string;
  expiresAt?: Date;
}): string {
  const { recipientName, senderName, documentName, signingUrl, message, expiresAt } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Signature Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Nutrient Sign</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Signature Request</h2>

          <p>Hi ${recipientName},</p>

          <p><strong>${senderName}</strong> has sent you a document to sign:</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${documentName}</p>
          </div>

          ${message ? `<p style="background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #ccc;">${message}</p>` : ''}

          ${expiresAt ? `<p style="color: #666; font-size: 14px;">⏰ This document expires on: <strong>${expiresAt.toLocaleDateString()}</strong></p>` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review & Sign Document
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${signingUrl}" style="color: #667eea;">${signingUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from Nutrient Sign. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;
}
