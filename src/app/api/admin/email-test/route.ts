import { NextRequest, NextResponse } from 'next/server';
import { sendRealEmail, getWelcomeEmailHtml, getWelcomeEmailText } from '@/lib/emailService';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';

function verifyAdmin(req: NextRequest): boolean {
  const headerKey = req.headers.get('x-admin-key');
  return headerKey === ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetEmail } = await req.json();

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid target email address is required for the live test.' },
        { status: 400 }
      );
    }

    const testSubject = `[Live Test] Welcome to Raga Finder Family! 🎵`;
    const testHtml = getWelcomeEmailHtml('Admin Tester', targetEmail);
    const testText = getWelcomeEmailText('Admin Tester', targetEmail);

    const result = await sendRealEmail({
      to: targetEmail.trim(),
      toName: 'Admin Tester',
      subject: testSubject,
      html: testHtml,
      text: testText,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Live test email successfully delivered to ${targetEmail}! Please check the inbox (and Spam/Promotions folder).`,
        provider: result.provider,
        log: result.log,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to deliver test email',
        provider: result.provider,
        log: result.log,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error during live test' },
      { status: 500 }
    );
  }
}
