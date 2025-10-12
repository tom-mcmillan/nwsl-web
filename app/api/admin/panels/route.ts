import { NextResponse } from 'next/server';

import {
  AdminPanelDefinition,
  createAdminPanel,
  fetchAdminPanels,
} from '@/lib/server/apiClient';

export async function GET() {
  try {
    const data = await fetchAdminPanels();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin panels list failed:', error);
    return NextResponse.json(
      { error: 'Failed to load panel catalog' },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AdminPanelDefinition;
    const response = await createAdminPanel(payload);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Admin panel create failed:', error);
    return NextResponse.json(
      { error: 'Failed to create panel' },
      { status: 400 }
    );
  }
}
