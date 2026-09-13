import { NextRequest, NextResponse } from 'next/server';
import { addMistakeReport } from '@/lib/storage';
import { MistakeReport } from '@/types/raga';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.aiSuggestedRaga || !body.userCorrection?.correctRaga) {
      return NextResponse.json(
        { success: false, error: 'aiSuggestedRaga and userCorrection.correctRaga are required' },
        { status: 400 }
      );
    }

    const newReport: MistakeReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      query: body.query || {},
      aiSuggestedRaga: body.aiSuggestedRaga,
      userCorrection: {
        correctRaga: body.userCorrection.correctRaga,
        correctSwaras: body.userCorrection.correctSwaras || '',
        notesOrExplanation: body.userCorrection.notesOrExplanation || '',
        reporterName: body.userCorrection.reporterName || 'Anonymous Contributor',
      },
      status: 'pending',
    };

    const saved = await addMistakeReport(newReport);
    return NextResponse.json({ success: true, report: saved });
  } catch (error: any) {
    console.error('Error submitting mistake report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit mistake report' },
      { status: 500 }
    );
  }
}
