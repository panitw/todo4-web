import { NextRequest } from 'next/server';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

async function proxy(req: NextRequest): Promise<Response> {
  const target = `${mcpUrl()}/mcp`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-expect-error — Node fetch supports duplex for streaming request bodies
      duplex: 'half',
      redirect: 'manual',
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set('Cache-Control', 'no-cache, no-transform');
    responseHeaders.set('X-Accel-Buffering', 'no');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown proxy error';
    console.error(`Failed to proxy ${target}`, err);
    return Response.json(
      { error: 'mcp_proxy_error', message, target },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;

export const dynamic = 'force-dynamic';
