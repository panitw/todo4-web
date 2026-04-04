import { NextRequest, NextResponse } from 'next/server';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    // @ts-expect-error — Node fetch supports duplex for streaming request bodies
    duplex: 'half',
    redirect: 'manual',
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
