import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { currentClientSecret } = await request.json().catch(() => ({}));

    if (!currentClientSecret) {
      return NextResponse.json(
        { error: 'Current client secret is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('ChatKit refresh attempted without API key configured');
      return NextResponse.json(
        { error: 'ChatKit is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chatkit/sessions/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        client_secret: currentClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      console.error('ChatKit refresh error:', response.status, error);
      throw new Error(`Failed to refresh ChatKit session: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ client_secret: data.client_secret });
  } catch (error) {
    console.error('Error refreshing ChatKit session:', error);
    return NextResponse.json(
      { error: 'Failed to refresh ChatKit session' },
      { status: 500 }
    );
  }
}
