import { NextRequest, NextResponse } from 'next/server';
import { getAIAvailability, testAIKey } from '@/lib/aiEngine';

export async function GET() {
  try {
    const availability = getAIAvailability();
    return NextResponse.json({
      serverHasKey: availability.available && availability.source === 'server',
      provider: availability.provider,
      model: availability.model,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, provider, model } = body;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please provide an API key to test' },
        { status: 400 }
      );
    }

    const testResult = await testAIKey(
      apiKey.trim(),
      provider === 'openai' ? 'openai' : 'gemini',
      model
    );

    return NextResponse.json(testResult);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error testing API key' },
      { status: 500 }
    );
  }
}
