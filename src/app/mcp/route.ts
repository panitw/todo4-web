import { NextRequest } from 'next/server';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

async function proxy(req: NextRequest): Promise<Response> {
  const target = `${mcpUrl()}/mcp`;

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : undefined;

  const res = await fetch(target, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      Accept:
        req.headers.get('accept') || 'application/json, text/event-stream',
      'Accept-Encoding': 'identity',
      ...(req.headers.get('authorization')
        ? { Authorization: req.headers.get('authorization')! }
        : {}),
      ...(req.headers.get('mcp-session-id')
        ? { 'Mcp-Session-Id': req.headers.get('mcp-session-id')! }
        : {}),
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('content-type') || 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      ...(res.headers.get('mcp-session-id')
        ? { 'Mcp-Session-Id': res.headers.get('mcp-session-id')! }
        : {}),
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;

export const dynamic = 'force-dynamic';
