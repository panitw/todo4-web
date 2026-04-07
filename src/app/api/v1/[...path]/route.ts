import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${apiUrl()}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  // Buffer the body to avoid undici "expected non-null body source" errors.
  // req.body can be null for bodyless POST/PATCH/DELETE requests, and passing
  // null (rather than undefined) to Node fetch causes it to throw.
  const shouldForwardBody = req.method !== 'GET' && req.method !== 'HEAD';
  let body: BodyInit | undefined;
  if (shouldForwardBody && req.body) {
    try {
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 0) body = buf;
    } catch {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 },
      );
    }
  }

  if (shouldForwardBody && body === undefined) {
    headers.delete('content-length');
    headers.delete('transfer-encoding');
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: 'manual', // pass 3xx back to the browser unchanged
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
