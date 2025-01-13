"use client";

import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth-actions';
import { useAuth } from '@/lib/auth-context';

export function AuthButton() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Button
        variant="ghost"
    onClick={logout}
    className="flex items-center gap-2 text-white hover:text-gray-300"
    >
    <LogOut className="h-4 w-4" />
      Logout
      </Button>
  );
  }

  return (
    <Link href="/login">
    <Button
      variant="ghost"
  className="flex items-center gap-2 text-white hover:text-gray-300"
  >
  <LogIn className="h-4 w-4" />
    Login
    </Button>
    </Link>
);
}