// lib/session-provider.js
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function SessionProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restore session from localStorage on mount
    const savedSession = localStorage.getItem('pact_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // You can use this to restore session state if needed
        console.log('Restored session from localStorage');
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      const handleStorage = () => {
        // You can implement session backup here
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [mounted]);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <NextAuthSessionProvider 
      refetchInterval={0} // Don't refetch automatically
      refetchOnWindowFocus={false} // Don't refetch on window focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}