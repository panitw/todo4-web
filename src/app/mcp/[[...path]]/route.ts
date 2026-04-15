import { NextRequest } from 'next/server';
import { Agent } from 'undici';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

// undici's default bodyTimeout (5 min, max time between body chunks) terminates
// idle SSE streams with UND_ERR_BODY_TIMEOUT — surfaced to the client as 502
// "failed to pipe response". Disable bodyTimeout for the upstream MCP fetch so
// long-lived SSE sessions stay open. headersTimeout stays at its default so a
// dead upstream that never sends a status line still fails fast.
const mcpDispatcher = new Agent({ bodyTimeout: 0 });

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
function responseHeaders(
  res: globalThis.Response,
  req?: NextRequest,
): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': res.headers.get('content-type') || 'text/event-stream',
  };
  const session = res.headers.get('mcp-session-id');
  if (session) h['Mcp-Session-Id'] = session;

  // On 401, build a WWW-Authenticate header with resource_metadata URL per RFC 9728
  // so the MCP client knows where to discover OAuth metadata
  if (res.status === 401 && req) {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || '';
    const resourceMetadataUrl = `${proto}://${host}/.well-known/oauth-protected-resource`;
    h['WWW-Authenticate'] =
      `Bearer resource_metadata="${resourceMetadataUrl}"`;
  }

  return h;
}

/**
 * Determine if the upstream response is a streaming SSE response that must
 * be piped through rather than buffered.
 */
function isStreamingResponse(res: globalThis.Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('text/event-stream');
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
    signal: req.signal,
    // @ts-expect-error - Node fetch supports undici dispatcher option
    dispatcher: mcpDispatcher,
  });

  // SSE streams (text/event-stream) must be piped through, not buffered.
  // Buffering with res.text() causes BodyTimeoutError on long-lived streams.
  if (isStreamingResponse(res) && res.body) {
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders(res, req),
    });
  }

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res, req),
  });
}

export async function GET(req: NextRequest): Promise<Response> {
  const { pathname, search } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}${search}`;

  const res = await fetch(target, {
    method: 'GET',
    headers: mcpHeaders(req),
    cache: 'no-store',
    signal: req.signal,
    // @ts-expect-error - Node fetch supports undici dispatcher option
    dispatcher: mcpDispatcher,
  });

  // GET on /mcp with a session ID returns an SSE stream for server notifications.
  // Must be piped through, not buffered.
  if (isStreamingResponse(res) && res.body) {
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders(res, req),
    });
  }

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res, req),
  });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}`;

  const res = await fetch(target, {
    method: 'DELETE',
    headers: mcpHeaders(req),
    cache: 'no-store',
    signal: req.signal,
    // @ts-expect-error - Node fetch supports undici dispatcher option
    dispatcher: mcpDispatcher,
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders(res, req),
  });
}

export const dynamic = 'force-dynamic';
