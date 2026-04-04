import { NextRequest } from 'next/server';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

// Only forward headers the MCP transport needs
function mcpHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    Accept: 'application/json, text/event-stream',
    'Accept-Encoding': 'identity',
  };
  const auth = req.headers.get('authorization');
  if (auth) h['Authorization'] = auth;
  const session = req.headers.get('mcp-session-id');
  if (session) h['Mcp-Session-Id'] = session;
  const lastEvent = req.headers.get('last-event-id');
  if (lastEvent) h['Last-Event-Id'] = lastEvent;
  return h;
}

// Forward Mcp-Session-Id from upstream response back to the client
function responseHeaders(res: globalThis.Response): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': res.headers.get('content-type') || 'text/event-stream',
  };
  const session = res.headers.get('mcp-session-id');
  if (session) h['Mcp-Session-Id'] = session;
  return h;
}

export async function POST(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}`;
  const body = await req.text();

  const res = await fetch(target, {
    method: 'POST',
    headers: mcpHeaders(req),
    body,
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res),
  });
}

export async function GET(req: NextRequest): Promise<Response> {
  const { pathname, search } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}${search}`;

  const res = await fetch(target, {
    method: 'GET',
    headers: mcpHeaders(req),
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res),
  });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}`;

  const res = await fetch(target, {
    method: 'DELETE',
    headers: mcpHeaders(req),
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res),
  });
}

export const dynamic = 'force-dynamic';
