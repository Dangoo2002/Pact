import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Redirect authenticated users away from auth pages
    if (token && (path === '/login' || path === '/signup')) {
      const role = token.role;
      if (role === 'student') return NextResponse.redirect(new URL('/student', req.url));
      if (role === 'instructor') return NextResponse.redirect(new URL('/instructor', req.url));
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Role-based protection
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
      authorized: ({ token }) => {
        // Allow access to public routes without token
        const publicPaths = ['/', '/login', '/signup', '/api/auth'];
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/student/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};