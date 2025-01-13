"use client";

// Remove unused Link import
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth-actions';
import { useAuth } from '@/lib/auth-context';
// Fix the import to use named import
import { AuthModal } from '@/components/AuthModal';

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
    <AuthModal
      trigger={
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-white hover:text-gray-300"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      }
      mode="rating"
    />
  );
}