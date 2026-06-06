// components/layout/RootLayoutClient.js
'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/'];

// Session storage key
const SESSION_STORAGE_KEY = 'pact_session';

// Inner component to handle session and routing
function AuthWrapper({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const redirectingRef = useRef(false);
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Save session to localStorage when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const sessionData = {
        user: session.user,
        expires: session.expires,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } else if (status === 'unauthenticated' && isClient && !isPublicRoute && !redirectingRef.current) {
      // Only redirect if not already redirecting and not on public route
      redirectingRef.current = true;
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [session, status, router, pathname, isPublicRoute, isClient]);

  // Handle redirect for authenticated users on login/signup pages
  useEffect(() => {
    if (status === 'authenticated' && session && (pathname === '/login' || pathname === '/signup') && !redirectingRef.current) {
      redirectingRef.current = true;
      const userRole = session.user?.role;
      if (userRole === 'student') {
        router.replace('/student');
      } else if (userRole === 'instructor') {
        router.replace('/instructor');
      } else if (userRole === 'admin') {
        router.replace('/admin');
      }
    }
  }, [session, status, pathname, router]);

  // Show loading on protected routes while checking authentication
  if (!isClient || (status === 'loading' && !isPublicRoute)) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // On public routes, always show content
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // On protected routes, only show if authenticated
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
}

export default function RootLayoutClient({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Restore session from localStorage on mount
    const restoreSession = async () => {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Check if session is still valid (not expired)
          if (session.user && session.expires && new Date(session.expires) > new Date()) {
            console.log('Valid session found in localStorage');
            // Don't need to do anything, NextAuth will handle it
          } else {
            console.log('Session expired, removing from localStorage');
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    };

    restoreSession();
  }, []);

  // Listen for session updates and save to localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === SESSION_STORAGE_KEY && !e.newValue) {
        // Session was cleared in another tab, reload to sync
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Prevent flash of unauthenticated content while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading PACT...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider
      refetchInterval={60 * 30} // Refetch every 30 minutes to keep session alive
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      onError={(error) => {
        console.error('Session error:', error);
        // Attempt to restore from localStorage on error
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            if (session.user && new Date(session.expires) > new Date()) {
              console.log('Valid session found in localStorage after error');
              // Reload to re-establish session
              window.location.reload();
            } else {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } catch (e) {
            console.error('Failed to restore session after error:', e);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}