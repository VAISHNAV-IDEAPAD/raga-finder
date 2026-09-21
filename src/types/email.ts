export type EmailProviderType = 'smtp' | 'resend' | 'brevo';

export interface EmailConfig {
  provider: EmailProviderType;
  // SMTP settings (Gmail or Custom)
  smtpHost?: string; // default: smtp.gmail.com
  smtpPort?: number; // default: 465
  smtpSecure?: boolean; // default: true
  smtpUser?: string; // e.g. ragafinder.official@gmail.com
  smtpPass?: string; // 16-character Google App Password or SMTP password
  fromName?: string; // e.g. "Raga Finder Family"
  fromEmail?: string; // e.g. "ragafinder.official@gmail.com"
  // API key alternatives
  resendApiKey?: string;
  brevoApiKey?: string;
  updatedAt?: string;
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: string;
  recipient: string;
  messageId?: string;
  error?: string;
  log?: string[];
}
