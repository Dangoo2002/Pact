'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function SessionProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading indicator while mounting to prevent flash
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading PACT...</p>
        </div>
      </div>
    );
  }

  return (
    <NextAuthSessionProvider
      refetchInterval={60 * 30}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}