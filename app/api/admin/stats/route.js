import { NextResponse } from 'next/server';
import * as eventLog from '../../../../lib/eventLog';

export const runtime = 'nodejs';
// Auth is handled by proxy.js (matches /api/admin/:path*).

export async function GET() {
  const [stats, recent] = await Promise.all([
    eventLog.globalStats(),
    eventLog.recentAcrossClients(300),
  ]);
  return NextResponse.json({ stats, recent });
}
