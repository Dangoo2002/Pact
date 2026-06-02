// lib/session-provider.js
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function SessionProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Restore session from localStorage on mount
    const restoreSession = () => {
      const savedSession = localStorage.getItem('pact_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session.user && session.expires && new Date(session.expires) > new Date()) {
            console.log('Valid session found in localStorage');
          } else {
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <NextAuthSessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      onError={(error) => {
        console.error('Session error:', error);
        const savedSession = localStorage.getItem('pact_session');
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            if (session.user && new Date(session.expires) > new Date()) {
              window.location.reload();
            }
          } catch (e) {
            localStorage.removeItem('pact_session');
          }
        }
      }}
    >
      {children}
    </NextAuthSessionProvider>
  );
}