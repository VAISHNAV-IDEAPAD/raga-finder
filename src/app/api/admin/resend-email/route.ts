import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUser } from '@/lib/userStorage';
import { sendWelcomeNotification } from '@/lib/notificationService';

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
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const notificationResult = await sendWelcomeNotification(user);
    user.welcomeNotificationSent = notificationResult.success;
    user.notificationDetails = notificationResult.message;
    await saveUser(user);

    return NextResponse.json({
      success: notificationResult.success,
      message: notificationResult.message,
      error: notificationResult.error,
      user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resend welcome email' }, { status: 500 });
  }
}
