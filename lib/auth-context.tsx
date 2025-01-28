import React, { createContext, useContext } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Create a default anonymous user
const defaultUser: User = {
  id: 0,
  name: 'Anonymous User',
  email: 'anonymous@example.com'
};

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  isAuthenticated: true, // Always authenticated
  login: () => {}, // Empty function
  logout: () => {}, // Empty function
  updateUser: () => {} // Empty function
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simplified provider that always returns authenticated state
  return (
    <AuthContext.Provider
      value={{
        user: defaultUser,
        isAuthenticated: true,
        login: () => {},
        logout: () => {},
        updateUser: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}