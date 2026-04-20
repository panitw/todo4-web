import { NextRequest, NextResponse } from 'next/server';

// Routes that do not require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email-change', '/auth', '/auth/code', '/privacy', '/terms', '/docs'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and Next.js internals
  if (isPublic(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Allow through if either cookie is present; if only refresh_token remains,
  // the client's apiFetch will silently refresh on the first 401.
  const hasSession =
    request.cookies.has('access_token') || request.cookies.has('refresh_token');

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const search = request.nextUrl.search;
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files, Next.js internals, and backend proxy routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/v1|mcp|oauth|\\.well-known|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico)$).*)'],
  // Note: 'mcp', 'oauth', and '.well-known' are excluded so agent/OAuth requests aren't redirected to /login
  // The /oauth/authorize page handles its own auth check (redirects to login if no cookie)
};
