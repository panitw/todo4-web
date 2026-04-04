import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () =>
  (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function POST(req: NextRequest): Promise<NextResponse> {
  const target = `${apiUrl()}/oauth/consent`;

  // Convert form-urlencoded to JSON if needed (form fallback from consent page)
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'identity',
  };

  // Forward cookies — the consent endpoint uses JwtAuthGuard which reads the httpOnly cookie
  const cookie = req.headers.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const res = await fetch(target, {
    method: 'POST',
    headers,
    body: jsonBody,
    redirect: 'manual',
    cache: 'no-store',
  });

  // Forward 302 redirects back to the client (redirect to Claude Desktop callback)
  if (res.status === 302) {
    const location = res.headers.get('location');
    return NextResponse.redirect(location!, { status: 302 });
  }

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export const dynamic = 'force-dynamic';
