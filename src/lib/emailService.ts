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

export { getWelcomeEmailHtml, getWelcomeEmailText } from './emailTemplates';
