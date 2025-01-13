"use client";

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth-actions';

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      onClick={logout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}