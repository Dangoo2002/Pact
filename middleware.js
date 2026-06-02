import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Allow public paths
    const publicPaths = ['/', '/login', '/signup', '/api/auth'];
    if (publicPaths.includes(path) || path.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role-based redirects
    if (path === '/') {
      if (token.role === 'student') return NextResponse.redirect(new URL('/student', req.url));
      if (token.role === 'instructor') return NextResponse.redirect(new URL('/instructor', req.url));
      if (token.role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
    }
    
    // Role-based protection
    if (path.startsWith('/student') && token.role !== 'student') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (path.startsWith('/instructor') && token.role !== 'instructor') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (path.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access to public routes without token
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/student/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};