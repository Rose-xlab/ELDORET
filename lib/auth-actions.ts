"use client";

export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Trigger storage event for auth state sync
    window.localStorage.setItem('auth', Date.now().toString());
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}