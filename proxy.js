import { NextResponse } from 'next/server';
import { isAdminRequest } from './lib/auth.js';

// Runs on every request to /admin and /api/admin/*, before the page or
// route handler. Proxy always runs on the Node.js runtime, so this can
// reuse the same timing-safe Basic Auth check as everything else rather
// than needing an Edge-compatible reimplementation.
export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};

export function proxy(request) {
  if (!process.env.DASHBOARD_USER || !process.env.DASHBOARD_PASSWORD) {
    return new NextResponse('Admin not configured: set DASHBOARD_USER and DASHBOARD_PASSWORD.', { status: 503 });
  }
  if (isAdminRequest(request)) {
    return NextResponse.next();
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}
