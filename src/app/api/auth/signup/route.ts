import { NextRequest, NextResponse } from 'next/server';
import { saveUser, findUserByIdentifier } from '@/lib/userStorage';
import { sendWelcomeNotification } from '@/lib/notificationService';
import { UserEntry, AuthProvider } from '@/types/user';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, mobile, provider, avatar } = body;

    if (!name || (!email && !mobile)) {
      return NextResponse.json(
        { success: false, error: 'Name and either Email or Mobile Number are required.' },
        { status: 400 }
      );
    }

    const identifier = email || mobile;
    const existing = await findUserByIdentifier(identifier);

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          isExistingUser: true,
          error: 'An account with this ' + (email ? 'email' : 'mobile number') + ' already exists. Please use Direct Login.',
          user: existing,
        },
        { status: 409 }
      );
    }

    const determinedProvider: AuthProvider = provider || (
      email?.includes('gmail') ? 'google' :
      email?.includes('outlook') || email?.includes('hotmail') || email?.includes('microsoft') ? 'microsoft' :
      mobile ? 'mobile' : 'email'
    );

    const newUser: UserEntry = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      mobile: mobile ? mobile.trim() : undefined,
      provider: determinedProvider,
      avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name.trim()),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active',
      welcomeNotificationSent: false,
      notificationType: email ? 'email' : 'sms',
      notificationDetails: email ? 'Pending delivery to ' + email.trim() : 'SMS confirmation',
    };

    // Dispatch real welcome notification
    const notificationResult = await sendWelcomeNotification(newUser);
    newUser.welcomeNotificationSent = notificationResult.success;
    newUser.notificationDetails = notificationResult.message;
    if ((notificationResult as any).emailPayload) {
      newUser.emailPayload = (notificationResult as any).emailPayload;
    }

    // Save user with true notification status
    await saveUser(newUser);

    return NextResponse.json({
      success: true,
      user: newUser,
      token: 'tok_' + Buffer.from(newUser.id + ':' + Date.now()).toString('base64'),
      notification: notificationResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Signup failed' }, { status: 500 });
  }
}
