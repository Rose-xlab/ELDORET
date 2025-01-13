// components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className = 'w-4 h-4' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner className="w-8 h-8" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
      </div>
    </div>
  );
}