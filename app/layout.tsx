"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useState, useEffect } from "react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { AuthButton } from "@/components/auth-button";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SearchProvider } from "@/components/SearchProvider";
import { StatsProvider } from "@/components/StatsProvider";
import { Avatar } from "@/components/ui/avatar";
import { KenyaThemeHeader } from "@/components/KenyaThemeHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

function TurnstileProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleTurnstileSuccess = async (token: string) => {
      try {
        const response = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
          console.error('Turnstile verification failed');
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

  return <>{children}</>;
}

function NavBar() {
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <KenyaThemeHeader />
      <nav className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Corruption Free Kenya</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/nominees" className="hover:text-primary-foreground/80 transition-colors">
                Officials
              </Link>
              <Link href="/institutions" className="hover:text-primary-foreground/80 transition-colors">
                Institutions
              </Link>
              <Link href="/leaderboard" className="hover:text-primary-foreground/80 transition-colors">
                Leaderboard
              </Link>

              <ThemeSwitcher />

              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile" className="flex items-center space-x-2 hover:text-primary-foreground/80">
                    <Avatar className="w-8 h-8">
                      <Image
                        src={user.image || "/npp.png"}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    </Avatar>
                    <span>{user.name}</span>
                  </Link>
                  <AuthButton />
                </div>
              ) : (
                <AuthButton />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2" 
              aria-label="Menu"
              onClick={toggleMobileMenu}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-primary-foreground/20">
                <Link 
                  href="/nominees" 
                  className="block px-3 py-2 rounded-md text-base hover:bg-primary-foreground/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Officials
                </Link>
                <Link 
                  href="/institutions" 
                  className="block px-3 py-2 rounded-md text-base hover:bg-primary-foreground/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Institutions
                </Link>
                <Link 
                  href="/leaderboard" 
                  className="block px-3 py-2 rounded-md text-base hover:bg-primary-foreground/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                
                <div className="px-3 py-2">
                  <ThemeSwitcher />
                </div>

                {isAuthenticated && user ? (
                  <div className="px-3 py-2">
                    <Link 
                      href="/profile" 
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Avatar className="w-8 h-8">
                        <Image
                          src={user.image || "/npp.png"}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </Avatar>
                      <span>{user.name}</span>
                    </Link>
                    <div className="mt-2">
                      <AuthButton />
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <AuthButton />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SearchProvider>
              <StatsProvider>
                <TurnstileProvider>
                  <div className="min-h-screen flex flex-col bg-background text-foreground">
                    <NavBar />
                    <div
                      className="cf-turnstile"
                      data-sitekey="0x4AAAAAAA5viAdFGy5HSP8u"
                      data-callback="onTurnstileSuccess"
                      data-theme="auto"
                    />
                    <main className="flex-grow">{children}</main>

                    <footer className="bg-primary text-primary-foreground">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          {/* About Section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About Us</h3>
                            <p className="text-primary-foreground/80">
                              Corruption Free Kenya is dedicated to empowering citizens in the fight against corruption in Kenya through 
                              transparent reporting and evidence-based accountability.
                            </p>
                            <div className="flex space-x-4">
                              {/* Add social media links here if needed */}
                            </div>
                          </div>

                          {/* Platform Links */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Platform</h3>
                            <ul className="space-y-2">
                              <li>
                                <Link href="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  About Us
                                </Link>
                              </li>
                              <li>
                                <Link href="/nominees" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Officials
                                </Link>
                              </li>
                              <li>
                                <Link href="/institutions" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Institutions
                                </Link>
                              </li>
                              <li>
                                <Link href="/leaderboard" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Leaderboard
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Actions */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            <ul className="space-y-2">
                              <li>
                                <Link href="/submit" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Submit Report
                                </Link>
                              </li>
                              <li>
                                <Link href="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Contact Us
                                </Link>
                              </li>
                              <li>
                                <Link href="/report" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Report Issue
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Legal */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                              <li>
                                <Link href="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Privacy Policy
                                </Link>
                              </li>
                              <li>
                                <Link href="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Terms of Use
                                </Link>
                              </li>
                              <li>
                                <Link href="/disclaimer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                                  Disclaimer
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-primary-foreground/20">
                          <p className="text-center text-primary-foreground/80">
                            © {new Date().getFullYear()} Corruption Free Kenya. All rights reserved.
                          </p>
                        </div>
                      </div>
                    </footer>
                  </div>
                  <SpeedInsights />
                  <Analytics />
                </TurnstileProvider>
              </StatsProvider>
            </SearchProvider>
          </AuthProvider>
        </ThemeProvider>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" 
          async 
          defer
        />
      </body>
    </html>
  );
}