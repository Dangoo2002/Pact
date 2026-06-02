import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Allow static and API routes
    if (path.startsWith('/_next') || path.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    // Redirect root to appropriate dashboard if logged in
    if (path === '/') {
      if (token) {
        if (token.role === 'student') return NextResponse.redirect(new URL('/student', req.url));
        if (token.role === 'instructor') return NextResponse.redirect(new URL('/instructor', req.url));
        if (token.role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }
    
    // Redirect to login if not authenticated for protected routes
    const protectedPaths = ['/student', '/instructor', '/admin'];
    if (protectedPaths.some(p => path.startsWith(p)) && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Role-based access control
    if (path.startsWith('/student') && token?.role !== 'student') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (path.startsWith('/instructor') && token?.role !== 'instructor') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true,
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};