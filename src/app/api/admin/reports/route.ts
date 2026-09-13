import { NextRequest, NextResponse } from 'next/server';
import { getMistakeReports, updateMistakeReportStatus, saveAdminRule } from '@/lib/storage';
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

  const reports = await getMistakeReports();
  return NextResponse.json({ success: true, reports });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportId, action, convertToRule } = await req.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: 'reportId and action are required' }, { status: 400 });
    }

    if (action === 'dismiss') {
      await updateMistakeReportStatus(reportId, 'dismissed');
      return NextResponse.json({ success: true, status: 'dismissed' });
    }

    if (action === 'approve_as_rule' && convertToRule) {
      const newRule: AdminRule = {
        id: `rule-taught-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: convertToRule.title || `Correction: ${convertToRule.correctRaga}`,
        patternType: convertToRule.patternType || 'correction',
        swaraPattern: convertToRule.swaraPattern || [],
        triggerKeywords: convertToRule.triggerKeywords || [],
        correctRaga: convertToRule.correctRaga,
        tradition: convertToRule.tradition || 'Both',
        ruleInstruction: convertToRule.ruleInstruction,
        severity: 'strict_override',
        active: true,
      };

      const savedRule = await saveAdminRule(newRule);
      await updateMistakeReportStatus(reportId, 'resolved', savedRule.id);

      return NextResponse.json({
        success: true,
        status: 'resolved',
        createdRule: savedRule,
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing convertToRule' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}
