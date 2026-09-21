import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { EmailConfig, SendEmailOptions, EmailSendResult } from '@/types/email';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'email_config.json');

let inMemoryConfig: EmailConfig | null = null;

/**
 * Retrieve current email configuration from persistent file or environment variables
 */
export function getEmailConfig(): EmailConfig {
  if (inMemoryConfig) {
    return inMemoryConfig;
  }

  // 1. Try reading from persistent JSON config
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read email_config.json, falling back to environment:', err);
  }

  // 2. Fallback to process.env variables
  const envConfig: EmailConfig = {
    provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
    smtpSecure: true,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'Raga Finder Family',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@ragafinder.com',
    resendApiKey: process.env.RESEND_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
  };

  inMemoryConfig = envConfig;
  return envConfig;
}

/**
 * Save updated email configuration
 */
export function saveEmailConfig(config: EmailConfig): boolean {
  inMemoryConfig = { ...config, updatedAt: new Date().toISOString() };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(inMemoryConfig, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Could not save email_config.json to disk (using in-memory):', err);
    return false;
  }
}

/**
 * Pure Node.js TLS SMTP Client (zero dependencies, works identically on Vercel & local)
 */
function sendViaSmtp(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; log: string[] }> {
  return new Promise((resolve, reject) => {
    const host = config.smtpHost || 'smtp.gmail.com';
    const port = config.smtpPort || 465;
    const user = config.smtpUser;
    const pass = config.smtpPass;
    const from = config.fromEmail || user || 'no-reply@ragafinder.com';
    const fromName = config.fromName || 'Raga Finder Family';

    if (!user || !pass) {
      return reject(new Error('SMTP Username or Password is not configured.'));
    }

    const log: string[] = [];
    const addLog = (msg: string) => log.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

    addLog(`Connecting to ${host}:${port} via TLS...`);

    const client = tls.connect(
      port,
      host,
      {
        rejectUnauthorized: false, // Prevents certificate revocation check hang on Windows/corporate proxy
        servername: host,
      },
      () => {
        addLog(`Connected securely to ${host}:${port}`);
      }
    );

    client.setEncoding('utf8');

    let step = 0;

    client.on('data', (chunk) => {
      const response = chunk.toString();
      addLog(`SERVER: ${response.trim().replace(/\r?\n/g, ' | ')}`);
      const code = parseInt(response.slice(0, 3), 10);

      // Error responses
      if (code >= 400 && code !== 421) {
        client.destroy();
        return reject(
          new Error(
            `SMTP Error (${code}): ${response.trim()}\nLogs:\n${log.join('\n')}`
          )
        );
      }

      if (step === 0 && code === 220) {
        step = 1;
        addLog(`CLIENT: EHLO localhost`);
        client.write(`EHLO localhost\r\n`);
      } else if (step === 1 && code === 250) {
        step = 2;
        addLog(`CLIENT: AUTH LOGIN`);
        client.write(`AUTH LOGIN\r\n`);
      } else if (step === 2 && code === 334) {
        step = 3;
        addLog(`CLIENT: [Sending User Base64]`);
        client.write(Buffer.from(user).toString('base64') + '\r\n');
      } else if (step === 3 && code === 334) {
        step = 4;
        addLog(`CLIENT: [Sending Pass Base64]`);
        client.write(Buffer.from(pass.replace(/\s+/g, '')).toString('base64') + '\r\n');
      } else if (step === 4 && code === 235) {
        step = 5;
        addLog(`CLIENT: MAIL FROM:<${from}>`);
        client.write(`MAIL FROM:<${from}>\r\n`);
      } else if (step === 5 && code === 250) {
        step = 6;
        addLog(`CLIENT: RCPT TO:<${options.to}>`);
        client.write(`RCPT TO:<${options.to}>\r\n`);
      } else if (step === 6 && code === 250) {
        step = 7;
        addLog(`CLIENT: DATA`);
        client.write(`DATA\r\n`);
      } else if (step === 7 && code === 354) {
        step = 8;
        const boundary = '----=_RagaFinderPart_' + Date.now().toString(36);
        const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`;
        const encodedFromName = `=?UTF-8?B?${Buffer.from(fromName).toString('base64')}?=`;

        const mimeMessage = [
          `From: ${encodedFromName} <${from}>`,
          `To: ${options.toName ? `"${options.toName}" <${options.to}>` : options.to}`,
          `Subject: ${encodedSubject}`,
          `MIME-Version: 1.0`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@ragafinder.com>`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          '',
          Buffer.from(options.text || '').toString('base64'),
          '',
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          '',
          Buffer.from(options.html).toString('base64'),
          '',
          `--${boundary}--`,
          '',
          '.',
          '',
        ].join('\r\n');

        addLog(`CLIENT: [Sending MIME Message Body]`);
        client.write(mimeMessage);
      } else if (step === 8 && code === 250) {
        step = 9;
        addLog(`CLIENT: QUIT`);
        client.write(`QUIT\r\n`);
        resolve({ success: true, messageId: response.trim(), log });
      }
    });

    client.on('error', (err) => {
      addLog(`Socket Error: ${err.message}`);
      reject(new Error(`Socket connection error: ${err.message}\nLogs:\n${log.join('\n')}`));
    });

    client.setTimeout(20000, () => {
      addLog(`Connection timed out after 20 seconds.`);
      client.destroy();
      reject(new Error(`SMTP connection timed out after 20 seconds.\nLogs:\n${log.join('\n')}`));
    });
  });
}

/**
 * Send via Resend REST API
 */
async function sendViaResend(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; log: string[] }> {
  const log: string[] = [];
  const addLog = (m: string) => log.push(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

  if (!config.resendApiKey) {
    throw new Error('Resend API key is not configured.');
  }

  addLog('Sending via Resend API (https://api.resend.com/emails)...');
  const from = config.fromEmail?.includes('@') ? config.fromEmail : 'onboarding@resend.dev';
  const fromName = config.fromName || 'Raga Finder Family';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.resendApiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${from}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Failed to send email via Resend API');
  }

  addLog(`Resend success: id=${data.id}`);
  return { success: true, messageId: data.id, log };
}

/**
 * Send via Brevo (Sendinblue) REST API
 */
async function sendViaBrevo(
  config: EmailConfig,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; log: string[] }> {
  const log: string[] = [];
  const addLog = (m: string) => log.push(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

  if (!config.brevoApiKey) {
    throw new Error('Brevo API key is not configured.');
  }

  addLog('Sending via Brevo REST API...');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.brevoApiKey,
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName || 'Raga Finder Family',
        email: config.fromEmail || 'ragafinder.official@gmail.com',
      },
      to: [{ email: options.to, name: options.toName || options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to send email via Brevo API');
  }

  addLog(`Brevo success: messageId=${data.messageId}`);
  return { success: true, messageId: data.messageId, log };
}

/**
 * Main dispatch function: transmits actual email to real recipient
 */
export async function sendRealEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const config = getEmailConfig();

  // Check if any service credentials are configured
  const hasSmtp = Boolean(config.smtpUser && config.smtpPass);
  const hasResend = Boolean(config.resendApiKey);
  const hasBrevo = Boolean(config.brevoApiKey);

  if (!hasSmtp && !hasResend && !hasBrevo) {
    return {
      success: false,
      provider: config.provider,
      recipient: options.to,
      error:
        'No outgoing email credentials configured. Please configure your Gmail App Password or Resend API key in the Admin Console (/admin -> Email & Notifications).',
      log: ['No active credentials detected in email_config.json or environment.'],
    };
  }

  try {
    if (config.provider === 'resend' || (hasResend && !hasSmtp)) {
      const result = await sendViaResend(config, options);
      return {
        success: true,
        provider: 'Resend API',
        recipient: options.to,
        messageId: result.messageId,
        log: result.log,
      };
    } else if (config.provider === 'brevo' || (hasBrevo && !hasSmtp)) {
      const result = await sendViaBrevo(config, options);
      return {
        success: true,
        provider: 'Brevo API',
        recipient: options.to,
        messageId: result.messageId,
        log: result.log,
      };
    } else {
      // Default: Pure TLS SMTP (Gmail / Custom)
      const result = await sendViaSmtp(config, options);
      return {
        success: true,
        provider: `SMTP (${config.smtpHost || 'smtp.gmail.com'})`,
        recipient: options.to,
        messageId: result.messageId,
        log: result.log,
      };
    }
  } catch (err: any) {
    console.error('Email delivery error:', err);
    return {
      success: false,
      provider: config.provider,
      recipient: options.to,
      error: err?.message || 'Failed to deliver email',
      log: err?.message?.includes('Logs:\n') ? err.message.split('Logs:\n')[1].split('\n') : [err.message],
    };
  }
}

/**
 * Generates the royal celebration HTML email template:
 * "Thank You For Joining Raga Finder Family"
 */
export function getWelcomeEmailHtml(userName: string, userContact: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You For Joining Raga Finder Family</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfbf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcfbf9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #fde68a; box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.1); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%); padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; line-height: 64px; font-size: 32px;">
                🎵
              </div>
              <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #fef3c7;">
                OFFICIAL WELCOME CELEBRATION
              </p>
              <h1 style="margin: 12px 0 0; font-size: 26px; line-height: 1.25; font-weight: 900; color: #ffffff;">
                Thank You For Joining<br>Raga Finder Family
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #44403c;">
                Dear <strong style="color: #1c1917;">${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #57534e;">
                Welcome aboard! We are thrilled to welcome you to the <strong>Raga Finder Family</strong>. Your account (<code>${userContact}</code>) is now fully verified and activated.
              </p>

              <!-- Highlight Feature Box -->
              <table role="presentation" width="100%" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #92400e;">
                      ✨ What You Can Explore Right Now:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #78350f;">
                      <li><strong>72 Melakarta Ragas:</strong> Explore the definitive parent ragas with swara notations and audio structures.</li>
                      <li><strong>AI Musicologist:</strong> Identify unindexed Carnatic and Hindustani film and classical compositions with 1 click.</li>
                      <li><strong>Interactive Swara Keyboard:</strong> Press swaras (S, R, G, M, P, D, N) to discover matching classical scales.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Call To Action Button -->
              <table role="presentation" width="100%" style="text-align: center; margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://raga-finder-ideapad.vercel.app" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d97706, #ea580c); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 14px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
                      Open Raga Finder Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 20px;">
                If you did not sign up for Raga Finder, please disregard this email.<br>
                Happy Music Exploration!<br>
                <strong style="color: #44403c;">The Raga Finder Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; border-top: 1px solid #f5f5f4; padding: 20px 32px; text-align: center; font-size: 11px; color: #a8a29e;">
              Raga Finder &bull; Carnatic & Hindustani Musicology &bull; All Rights Reserved
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plaintext version for fallback
 */
export function getWelcomeEmailText(userName: string, userContact: string): string {
  return `Thank You For Joining Raga Finder Family!

Dear ${userName},

Welcome to the Raga Finder Family! Your account (${userContact}) has been created and verified.

What you can explore on Raga Finder:
- 72 Melakarta Parent Ragas
- AI-Powered Song Raga Identification (Carnatic & Hindustani)
- Interactive Swara Keyboard & Scale Detection

Visit Raga Finder now:
https://raga-finder-ideapad.vercel.app

Happy Music Exploration!
The Raga Finder Team`;
}
