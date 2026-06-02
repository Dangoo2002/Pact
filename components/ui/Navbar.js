'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Menu, User, Code } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-accent"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg hidden sm:block">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">PACT Learning Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{session?.user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}