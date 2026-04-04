import { NextRequest } from 'next/server';

const mcpUrl = () =>
  (process.env.MCP_URL || 'http://localhost:3002').replace(/\/$/, '');

export async function POST(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}`;
  const body = await req.text();

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Accept-Encoding': 'identity',
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'text/event-stream',
    },
  });
}

export async function GET(req: NextRequest): Promise<Response> {
  const { pathname, search } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}${search}`;

  const res = await fetch(target, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Accept-Encoding': 'identity',
    },
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const target = `${mcpUrl()}${pathname}`;

  const res = await fetch(target, {
    method: 'DELETE',
    headers: { 'Accept-Encoding': 'identity' },
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new Response(responseBody, { status: res.status });
}

export const dynamic = 'force-dynamic';
