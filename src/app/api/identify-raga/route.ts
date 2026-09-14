import { NextRequest, NextResponse } from 'next/server';
import { identifyRaga } from '@/lib/openai';
import { IdentifyRequest } from '@/types/raga';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IdentifyRequest;

    if (!body || !body.mode) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: "mode" is required' },
        { status: 400 }
      );
    }

    if (body.mode === 'song' && (!body.songQuery || body.songQuery.trim() === '')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a song, kriti, or raga name to search' },
        { status: 400 }
      );
    }

    if (body.mode === 'swaras' && (!body.swaras || body.swaras.length < 3)) {
      return NextResponse.json(
        { success: false, error: 'Please select at least 3 swaras to identify a raga' },
        { status: 400 }
      );
    }

    const result = await identifyRaga(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error identifying raga:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during raga identification',
      },
      { status: 500 }
    );
  }
}
