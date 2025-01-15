import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = [
 '/login', 
 '/register', 
 '/', 
 '/admin/login',  // Added admin login
 '/api/auth/login', 
 '/api/auth/register',
 '/nominees',
 '/leaderboard',
 '/institutions',
 '/api/institutions',
 '/api/nominees',
 '/api/statistics',
 '/api/users/rate-limit',
 '/api/leaderboard',
 '/api/auth/verify-admin',
 '/api/auth/admin/login'  // Added admin login API
];

const adminPaths = [
 '/admin',
 '/admin/login',
 '/admin/users',
 '/admin/nominees', 
 '/admin/positions',
 '/admin/institutions',
 '/admin/districts',
 '/admin/departments',
 '/admin/impact-areas',
 '/admin/rating-categories',
 '/admin/institution-rating-categories',
 '/admin/scandals',
 '/admin/evidence',
 '/api/admin'
];

const isPublicPath = (pathname: string) => {
 console.log('Checking public path:', pathname);
 return publicPaths.some(path => pathname.startsWith(path));
};

const isAdminPath = (pathname: string) => {
 console.log('Checking admin path:', pathname);
 return adminPaths.some(path => pathname === path || pathname.startsWith(path));
};

const verifyToken = async (token: string) => {
 try {
   const { payload } = await jwtVerify(
     token, 
     new TextEncoder().encode(process.env.JWT_SECRET)
   );
   return payload;
 } catch {
   return null;
 }
};

export async function middleware(request: NextRequest) {
 const token = request.cookies.get('token')?.value;
 const { pathname } = request.nextUrl;

 console.log('Current path:', pathname);

 // Allow OPTIONS requests for CORS
 if (request.method === 'OPTIONS') {
   return NextResponse.next();
 }

 // Check for admin login path specifically
 if (pathname === '/admin/login') {
   return NextResponse.next();
 }

 // Check for admin routes
 if (isAdminPath(pathname)) {
   console.log('Processing admin path:', pathname);

   if (!token) {
     console.log('No token found, redirecting to admin login');
     return NextResponse.redirect(new URL('/admin/login', request.url));
   }

   const payload = await verifyToken(token);
   console.log('Token payload for admin:', payload);

   if (!payload || payload.role !== 'ADMIN') {
     console.log('Not admin role, redirecting to admin login');
     return NextResponse.redirect(new URL('/admin/login', request.url));
   }
   return NextResponse.next();
 }

 // Handle verify-admin endpoint
 if (pathname === '/api/auth/verify-admin') {
   if (!token) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const payload = await verifyToken(token);
   if (!payload || payload.role !== 'ADMIN') {
     return NextResponse.json({ error: 'Not admin' }, { status: 403 });
   }

   return NextResponse.next();
 }

 // Public paths bypass auth
 if (isPublicPath(pathname)) {
   console.log('Allowing public path:', pathname);
   return NextResponse.next();
 }

 // For API routes
 if (pathname.startsWith('/api/')) {
   if (!token) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const payload = await verifyToken(token);
   if (!payload) {
     return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
   }

   const response = NextResponse.next();
   response.headers.set('Access-Control-Allow-Credentials', 'true');
   response.headers.set('Access-Control-Allow-Origin', '*');
   response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
   response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   return response;
 }

 // Non-API protected routes
 if (!token) {
   console.log('No token, redirecting to login');
   return NextResponse.redirect(new URL('/login', request.url));
 }

 const payload = await verifyToken(token);
 if (!payload) {
   console.log('Invalid token, redirecting to login');
   return NextResponse.redirect(new URL('/login', request.url));
 }

 return NextResponse.next();
}

export const config = {
 matcher: [
   '/admin',
   '/admin/:path*',
   '/api/:path*',
   '/dashboard/:path*',
   '/profile/:path*',
   '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
 ]
};