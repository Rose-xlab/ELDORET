"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/auth-context';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  trigger: React.ReactElement;
  mode: "rating" | "comment" | "evidence";
  children?: React.ReactNode;
  onSuccess?: () => void;
}

// Helper function to get the appropriate text based on mode
function getModeText(mode: AuthModalProps['mode']) {
  switch (mode) {
    case "rating":
      return { action: "rate", item: "item" };
    case "comment":
      return { action: "comment on", item: "post" };
    case "evidence":
      return { action: "submit evidence to", item: "report" };
    default:
      return { action: "continue with", item: "action" };
  }
}

export function AuthModal({ trigger, mode = "rating", onSuccess }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const modeText = getModeText(mode);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          ...(isLogin ? {} : { name: formData.get('name') }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      if (isLogin) {
        const { token } = await response.json();
        login(token);
      } else {
        // After registration, automatically log them in
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.get('email'),
            password: formData.get('password'),
          }),
        });
        const { token } = await loginResponse.json();
        login(token);
      }

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLogin ? (
              <>
                <LogIn className="h-5 w-5" />
                Sign in to continue
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create an account
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLogin 
              ? `You need to sign in to ${modeText.action} this ${modeText.item}.`
              : "Join our community to share your feedback and help fight corruption."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading 
                ? (isLogin ? 'Signing in...' : 'Creating account...') 
                : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
            <div className="text-center text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}