import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const workflowId = process.env.CHATKIT_WORKFLOW_ID;
    const apiKey = process.env.OPENAI_API_KEY;

    console.log('Creating ChatKit session');
    console.log('Workflow ID:', workflowId);
    console.log('API Key present:', !!apiKey);
    console.log('API Key first 20 chars:', apiKey?.substring(0, 20));

    const requestBody = {
      workflow: {
        id: workflowId
      },
      user: 'nwsl-web-user-' + Date.now(),
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

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
