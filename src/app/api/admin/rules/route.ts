import { NextRequest, NextResponse } from 'next/server';
import { getAdminRules, saveAdminRule, deleteAdminRule, importRules } from '@/lib/storage';
import { AdminRule } from '@/types/raga';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('x-admin-key');
  const expectedKey = process.env.ADMIN_SECRET_KEY || 'ragamaster2026';
  return authHeader === expectedKey;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rules = await getAdminRules();
  return NextResponse.json({ success: true, rules });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Handle bulk import
    if (body.bulk && Array.isArray(body.rules)) {
      const count = await importRules(body.rules);
      return NextResponse.json({ success: true, imported: count });
    }

    // Single rule save/update
    const rule: AdminRule = {
      id: body.id || `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      title: body.title,
      patternType: body.patternType || 'swaras',
      swaraPattern: body.swaraPattern || [],
      triggerKeywords: body.triggerKeywords || [],
      correctRaga: body.correctRaga,
      tradition: body.tradition || 'Both',
      ruleInstruction: body.ruleInstruction,
      severity: body.severity || 'strict_override',
      active: body.active !== undefined ? body.active : true,
    };

    if (!rule.title || !rule.correctRaga || !rule.ruleInstruction) {
      return NextResponse.json(
        { error: 'title, correctRaga, and ruleInstruction are required' },
        { status: 400 }
      );
    }

    const saved = await saveAdminRule(rule);
    return NextResponse.json({ success: true, rule: saved });
  } catch (error: any) {
    console.error('Error saving admin rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    await deleteAdminRule(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
