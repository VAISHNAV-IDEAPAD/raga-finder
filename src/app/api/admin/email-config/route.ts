import { NextRequest, NextResponse } from 'next/server';
import { getEmailConfig, saveEmailConfig } from '@/lib/emailService';
import { EmailConfig } from '@/types/email';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';

function verifyAdmin(req: NextRequest): boolean {
  const headerKey = req.headers.get('x-admin-key');
  return headerKey === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getEmailConfig();

  // Mask sensitive passwords/keys before sending to UI
  const safeConfig = {
    ...config,
    smtpPass: config.smtpPass ? '••••••••' : '',
    resendApiKey: config.resendApiKey ? 're_••••••••' : '',
    brevoApiKey: config.brevoApiKey ? 'xkeysib-••••••••' : '',
    isConfigured: Boolean((config.smtpUser && config.smtpPass) || config.resendApiKey || config.brevoApiKey),
  };

  return NextResponse.json({ success: true, config: safeConfig });
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const current = getEmailConfig();

    const updatedConfig: EmailConfig = {
      provider: body.provider || current.provider || 'smtp',
      smtpHost: body.smtpHost || current.smtpHost || 'smtp.gmail.com',
      smtpPort: body.smtpPort ? parseInt(body.smtpPort, 10) : current.smtpPort || 465,
      smtpSecure: body.smtpSecure !== undefined ? Boolean(body.smtpSecure) : true,
      smtpUser: body.smtpUser !== undefined ? body.smtpUser.trim() : current.smtpUser,
      // If user kept the masked placeholder, keep existing password
      smtpPass:
        body.smtpPass && !body.smtpPass.includes('••••')
          ? body.smtpPass.trim()
          : current.smtpPass,
      fromName: body.fromName !== undefined ? body.fromName.trim() : current.fromName || 'Raga Finder Family',
      fromEmail: body.fromEmail !== undefined ? body.fromEmail.trim() : current.fromEmail,
      resendApiKey:
        body.resendApiKey && !body.resendApiKey.includes('••••')
          ? body.resendApiKey.trim()
          : current.resendApiKey,
      brevoApiKey:
        body.brevoApiKey && !body.brevoApiKey.includes('••••')
          ? body.brevoApiKey.trim()
          : current.brevoApiKey,
    };

    saveEmailConfig(updatedConfig);

    return NextResponse.json({
      success: true,
      message: 'Email configuration saved successfully!',
      isConfigured: Boolean(
        (updatedConfig.smtpUser && updatedConfig.smtpPass) ||
          updatedConfig.resendApiKey ||
          updatedConfig.brevoApiKey
      ),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save email configuration' }, { status: 500 });
  }
}
