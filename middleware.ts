import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';

// Define public routes that dont require authentication
const publicRoutes = ['/', '/login', '/signup', '/verify-request'];

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(`${route}/`));

  // If its not a public route, check for authentication
  if (!isPublicRoute) {
    const session = await auth();

    // If no session exists, redirect to login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      // Add the original path as a redirect parameter
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Clone the response for the authenticated user or public route
  const response = NextResponse.next();

  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  // Apply this middleware to all routes except API routes and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
