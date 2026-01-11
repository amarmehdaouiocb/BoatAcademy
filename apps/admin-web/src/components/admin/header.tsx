'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Bell, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AdminHeaderProps {
  user: {
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'instructor';
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b border-navy-100 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">Administration</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative rounded-lg p-2.5 text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span>
          </span>
        </button>

        {/* Settings */}
        <button className="rounded-lg p-2.5 text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-700">
          <Settings className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-8 w-px bg-navy-100"></div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-navy-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-navy-900">{user.name}</p>
              <p className="text-xs capitalize text-navy-500">{user.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-navy-400" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-dropdown">
                <div className="border-b border-navy-100 bg-navy-50/50 px-4 py-3">
                  <p className="font-medium text-navy-900">{user.name}</p>
                  <p className="text-sm text-navy-500">{user.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
