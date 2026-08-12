import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const client = await clients.update(id, body);
    if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });
    return NextResponse.json({ success: true, client });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const existed = await clients.remove(id);
  return NextResponse.json({ success: existed });
}
