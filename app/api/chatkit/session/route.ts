import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: {
          id: process.env.CHATKIT_WORKFLOW_ID
        },
        user: 'nwsl-web-user',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ChatKit session error:', error);
      throw new Error(`Failed to create ChatKit session: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ client_secret: data.client_secret });
  } catch (error) {
    console.error('Error creating ChatKit session:', error);
    return NextResponse.json(
      { error: 'Failed to create ChatKit session' },
      { status: 500 }
    );
  }
}
