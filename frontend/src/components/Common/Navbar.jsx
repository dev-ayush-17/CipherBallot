import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/*
 * Navbar — Top Navigation Bar
 * Shared component used across all pages (Member 3 & Member 4).
 *
 * Features:
 *   - Left: Navigation links (Elections, Proposals, Archives)
 *   - Right: Wallet connection status, notification bell, settings gear
 *   - Responsive: Collapses to hamburger on mobile
 */

export default function Navbar({ account, isConnected, onConnect, onDisconnect }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ─── Format wallet address: 0x12a4...3b9c ─── */
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  /* ─── Check if a nav link is active ─── */
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Elections' },
    { path: '/dashboard', label: 'Proposals' },
    { path: '/results', label: 'Archives' },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ─── Left: Brand & Navigation Links ─── */}
          <div className="flex items-center gap-8">
            <span className="font-brand font-black text-lg text-terminal-black tracking-wide uppercase">
              CipherBallot
            </span>
            <div className="hidden md:flex items-center gap-6 border-l border-gray-200 pl-6 h-5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-semibold uppercase tracking-protocol transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-terminal-black border-b-2 border-terminal-black py-4'
                      : 'text-terminal-grey hover:text-terminal-black py-4'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Center: Brand (Mobile) ─── */}
          <div className="md:hidden">
            <span className="font-brand font-bold text-lg text-terminal-black tracking-wide">
              CIPHERBALLOT
            </span>
          </div>

          {/* ─── Right: Actions ─── */}
          <div className="flex items-center gap-4">
            {/* Institutional Pillar Icon */}
            <button
              className="p-2 text-terminal-black hover:text-protocol-blue transition-colors"
              aria-label="Civic Terminal Overview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                />
              </svg>
            </button>

            {/* Notification Bell */}
            <button
              className="p-2 text-terminal-black hover:text-protocol-blue transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-terminal-grey hover:text-terminal-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* ─── Mobile Menu Dropdown ─── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium ${
                    isActive(link.path)
                      ? 'text-terminal-black bg-gray-50'
                      : 'text-terminal-grey hover:text-terminal-black hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile wallet button */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                {isConnected ? (
                  <button
                    onClick={onDisconnect}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-terminal-black"
                  >
                    <span className="w-2 h-2 rounded-full bg-status-active status-dot-live" />
                    {formatAddress(account)}
                  </button>
                ) : (
                  <button
                    onClick={onConnect}
                    className="w-full px-3 py-2 bg-terminal-black text-white text-sm font-medium"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
