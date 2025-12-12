import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert to proper format for Whisper using OpenAI's toFile utility
    const audioBuffer = await audio.arrayBuffer();
    const audioFile = await toFile(
      Buffer.from(audioBuffer),
      'audio.webm',
      { type: audio.type || 'audio/webm' }
    );

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({
      text: response.text,
      success: true
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
