import { useState, useEffect } from 'react';

/*
 * Footer — Bottom Bar
 * Matches the inspiration design's institutional footer:
 *   - Left: "OFFICIAL CIVIC VOTING PORTAL V4.2.0"
 *   - Center: "Privacy Policy", "Audit Logs" links
 *   - Right: "ENCRYPTED BY QUANTUM-LEDGER"
 *   - Above main bar: GEO: [ENCRYPTED] | TIME: live UTC clock
 */

export default function Footer() {
  const [currentTime, setCurrentTime] = useState('');

  /* ─── Live UTC clock ─── */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      {/* ─── Info Bar ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 text-[11px] font-mono text-terminal-grey border-b border-gray-100">
          <span>GEO: [ENCRYPTED]</span>
          <span>TIME: {currentTime}</span>
        </div>
      </div>

      {/* ─── Main Footer ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-2">
          {/* Left */}
          <p className="text-[11px] font-semibold uppercase tracking-protocol text-terminal-black">
            Official CipherBallot Portal V4.2.0
          </p>

          {/* Center Links */}
          <div className="flex items-center gap-6">
            <a
              href="#privacy"
              className="text-xs text-terminal-grey hover:text-terminal-black transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#audit"
              className="text-xs text-terminal-grey hover:text-terminal-black transition-colors"
            >
              Audit Logs
            </a>
          </div>

          {/* Right */}
          <p className="text-[11px] font-mono uppercase tracking-wide text-terminal-grey">
            Encrypted by Quantum-Ledger
          </p>
        </div>
      </div>
    </footer>
  );
}
