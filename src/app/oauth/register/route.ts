import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function POST(req: NextRequest): Promise<NextResponse> {
  const target = `${apiUrl()}/oauth/register`;
  const body = await req.text();

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      'Accept-Encoding': 'identity',
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export const dynamic = 'force-dynamic';
