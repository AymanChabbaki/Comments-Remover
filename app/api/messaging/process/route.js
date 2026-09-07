import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processQueue } from '../../../../lib/messaging';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ results: await processQueue() });
}
