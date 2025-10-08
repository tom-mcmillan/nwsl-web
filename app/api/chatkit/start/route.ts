import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const workflowId = process.env.CHATKIT_WORKFLOW_ID;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!workflowId || !apiKey) {
      console.error('ChatKit configuration missing workflow ID or API key');
      return NextResponse.json(
        { error: 'ChatKit is not configured' },
        { status: 500 }
      );
    }

    const requestBody = {
      workflow: {
        id: workflowId,
        version: "2"
      },
      user: 'nwsl-web-user-' + Date.now(),
    };

    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      console.error('ChatKit session error:', response.status, error);
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
