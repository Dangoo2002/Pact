// components/layout/RootLayoutClient.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export default function RootLayoutClient({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Restore session from localStorage on mount
    const restoreSession = async () => {
      const savedSession = localStorage.getItem('pact_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Check if session is still valid
          if (session.user && session.expires && new Date(session.expires) > new Date()) {
            console.log('Valid session found in localStorage');
            // Optionally trigger a silent re-authentication here
          } else {
            console.log('Session expired, removing from localStorage');
            localStorage.removeItem('pact_session');
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          localStorage.removeItem('pact_session');
        }
      }
    };

    restoreSession();
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    const handleSessionChange = () => {
      // This will be called when the session updates
      // You can access the session via the useSession hook in child components
    };

    return () => {
      // Cleanup
    };
  }, []);

  if (!mounted) {
    // Return a loading state to prevent hydration mismatch
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      onError={(error) => {
        console.error('Session error:', error);
        // Attempt to restore from localStorage on error
        const savedSession = localStorage.getItem('pact_session');
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            if (session.user && new Date(session.expires) > new Date()) {
              console.log('Restoring session from localStorage after error');
              window.location.reload();
            }
          } catch (e) {
            console.error('Failed to restore session after error:', e);
            localStorage.removeItem('pact_session');
          }
        }
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}