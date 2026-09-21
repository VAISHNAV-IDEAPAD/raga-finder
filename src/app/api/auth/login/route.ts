import { NextRequest, NextResponse } from 'next/server';
import { findUserByIdentifier, updateUser } from '@/lib/userStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, provider, email } = body;

    // Fast-path for Google / Microsoft logins
    if (provider === 'google' || provider === 'microsoft') {
      const emailOrPhone = email || identifier;
      if (emailOrPhone) {
        const user = await findUserByIdentifier(emailOrPhone);
        if (user) {
          await updateUser(user.id, { lastLoginAt: new Date().toISOString() });
          return NextResponse.json({
            success: true,
            isNewUser: false,
            user: { ...user, lastLoginAt: new Date().toISOString() },
            token: 'tok_' + Buffer.from(user.id + ':' + Date.now()).toString('base64'),
          });
        }
      }
    }

    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your email or mobile number.' }, { status: 400 });
    }

    const user = await findUserByIdentifier(identifier.trim());
    if (!user) {
      return NextResponse.json({
        success: false,
        notFound: true,
        error: 'No account found with this email or mobile number. Please Sign Up.',
      }, { status: 404 });
    }

    const updated = await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      user: updated || user,
      token: 'tok_' + Buffer.from(user.id + ':' + Date.now()).toString('base64'),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Login failed' }, { status: 500 });
  }
}
