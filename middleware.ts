// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = [
  '/login', 
  '/register', 
  '/', 
  '/api/auth/login', 
  '/api/auth/register',
  '/nominees',
  '/leaderboard',
  '/institutions',
  '/admin',
  '/api/institutions',
  '/api/nominees',
  '/api/statistics',
  '/api/users/rate-limit',
  '/api/leaderboard'
];

// Helper to check if a path should be public
const isPublicPath = (pathname: string) => {
  return publicPaths.some(path => pathname.startsWith(path));
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Allow OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Public paths bypass auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      const response = NextResponse.next();
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  // Non-API protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/((?!login|register|nominees|leaderboard|institutions|api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
};