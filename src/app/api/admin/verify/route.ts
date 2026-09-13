import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { secretKey } = await req.json();
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';

    if (secretKey === expectedKey) {
      return NextResponse.json({ success: true, authorized: true });
    } else {
      return NextResponse.json(
        { success: false, authorized: false, error: 'Invalid admin secret key' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
