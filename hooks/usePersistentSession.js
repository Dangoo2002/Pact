// hooks/usePersistentSession.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export function usePersistentSession() {
  const { data: session, status, update } = useSession();
  const sessionBackup = useRef(null);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const sessionData = {
        user: session.user,
        expires: session.expires,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('pact_session', JSON.stringify(sessionData));
      sessionBackup.current = sessionData;
    } else if (status === 'unauthenticated') {
      localStorage.removeItem('pact_session');
      sessionBackup.current = null;
    }
  }, [session, status]);

  // Attempt to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (status === 'loading' && !session) {
        const savedSession = localStorage.getItem('pact_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            // Check if session is still valid (not expired)
            if (parsed.expires && new Date(parsed.expires) > new Date()) {
              console.log('Valid session found in localStorage');
              // Optionally trigger a session refresh
            } else {
              localStorage.removeItem('pact_session');
            }
          } catch (e) {
            console.error('Failed to restore session', e);
            localStorage.removeItem('pact_session');
          }
        }
      }
    };

    restoreSession();
  }, [session, status]);

  return { session, status, update };
}