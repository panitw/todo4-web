import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function POST(req: NextRequest): Promise<NextResponse> {
  const target = `${apiUrl()}/oauth/token`;

  // MCP SDK sends application/x-www-form-urlencoded — convert to JSON for NestJS
  const contentType = req.headers.get('content-type') || '';
  let jsonBody: string;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    const obj: Record<string, string> = {};
    formData.forEach((value, key) => {
      obj[key] = value.toString();
    });
    jsonBody = JSON.stringify(obj);
  } else {
    jsonBody = await req.text();
  }

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
    },
    body: jsonBody,
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
