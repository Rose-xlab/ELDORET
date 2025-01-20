"use client";

import { useState, useEffect } from "react";

export function TurnstileOverlay() {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('turnstileVerified') === 'true') {
      setIsVerified(true);
      return;
    }

    const handleTurnstileSuccess = async (token: string) => {
      try {
        const response = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
        
        if (response.ok) {
          setIsVerified(true);
          localStorage.setItem('turnstileVerified', 'true');
        } else {
          if (window.turnstile) {
            window.turnstile.reset();
          }
        }
      } catch (error) {
        console.error('Error verifying Turnstile:', error);
      }
    };

    window.onTurnstileSuccess = handleTurnstileSuccess;

    return () => {
      window.onTurnstileSuccess = undefined;
    };
  }, []);

  if (isVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div
        className="cf-turnstile"
        data-sitekey="0x4AAAAAAA5vc55Su3q554m8"
        data-callback="onTurnstileSuccess"
        data-theme="auto"
      />
    </div>
  );
}