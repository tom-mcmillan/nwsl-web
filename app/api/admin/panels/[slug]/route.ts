import { NextResponse } from 'next/server';

import {
  AdminPanelDefinition,
  deleteAdminPanel,
  fetchAdminPanel,
  saveAdminPanel,
} from '@/lib/server/apiClient';

type Params = { slug: string };

const isPromise = <T>(value: T | Promise<T>): value is Promise<T> =>
  typeof (value as Promise<T>)?.then === 'function';

export async function GET(
  _request: Request,
  context: { params: Params | Promise<Params> }
) {
  try {
    const params = isPromise(context.params) ? await context.params : context.params;
    const response = await fetchAdminPanel(params.slug);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin panel fetch failed:', error);
    return NextResponse.json(
      { error: 'Panel not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Params | Promise<Params> }
) {
  try {
    const params = isPromise(context.params) ? await context.params : context.params;
    const payload = (await request.json()) as AdminPanelDefinition;
    payload.slug = params.slug;
    const response = await saveAdminPanel(payload);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin panel update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update panel' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Params | Promise<Params> }
) {
  try {
    const params = isPromise(context.params) ? await context.params : context.params;
    await deleteAdminPanel(params.slug);
    return NextResponse.json({ message: 'Panel deleted' });
  } catch (error) {
    console.error('Admin panel delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete panel' },
      { status: 400 }
    );
  }
}
