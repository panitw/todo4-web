import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${apiUrl()}${pathname}${search}`;

  const res = await fetch(target, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'identity',
      'X-Forwarded-Host': req.headers.get('host') || '',
      'X-Forwarded-Proto': req.headers.get('x-forwarded-proto') || 'https',
    },
    cache: 'no-store',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = proxy;

export const dynamic = 'force-dynamic';
