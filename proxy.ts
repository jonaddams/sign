import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(_request: NextRequest) {
  // Add cache control headers to prevent caching of dynamic pages
  const response = NextResponse.next();

  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  // Apply cache headers to all routes except static files
  // Note: Authentication is now handled by (protected) layout, not proxy
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
