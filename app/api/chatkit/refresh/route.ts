import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { currentClientSecret } = await request.json();

    if (!currentClientSecret) {
      return NextResponse.json(
        { error: 'Current client secret is required' },
        { status: 400 }
      );
    }

    console.log('Refreshing ChatKit session');

    const response = await fetch('https://api.openai.com/v1/chatkit/sessions/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        client_secret: currentClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ChatKit refresh error:', error);
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
