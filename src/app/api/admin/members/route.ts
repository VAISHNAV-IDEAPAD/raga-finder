import { NextRequest, NextResponse } from 'next/server';
import { getUsers, deleteUser } from '@/lib/userStorage';
import { getNotificationLogs } from '@/lib/notificationService';

export async function GET(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const expected = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';

    if (!adminKey || adminKey !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin Secret Key' }, { status: 401 });
    }

    const members = await getUsers();
    const notificationLogs = await getNotificationLogs();

    return NextResponse.json({
      success: true,
      totalCount: members.length,
      members,
      notificationLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const expected = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';

    if (!adminKey || adminKey !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
