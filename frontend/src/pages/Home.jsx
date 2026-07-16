import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useMetaMask from '../hooks/useMetaMask';

/*
 * Home.jsx — Landing / Login Page
 * Design: Institutional auth terminal matching the "SYSTEM.AUTH_V4.2.0" inspiration.
 *
 * Features:
 *   - Centered auth card with "CIPHERBALLOT" serif heading
 *   - "DIGITAL SIGNATURE AUTHENTICATION" button → MetaMask connection
 *   - Numbered protocol instructions
 *   - "ACCESS VIA PHYSICAL CREDENTIAL" secondary button (SSO placeholder)
 *   - NODE_STATUS floating indicator
 *   - Immutability disclaimer
 *   - Status footer bar
 */

export default function Home() {
  const navigate = useNavigate();
  const {
    account,
    isConnected,
    isConnecting,
    error,
    isMetaMaskInstalled,
    connectWallet,
  } = useMetaMask();

  // Redirect to dashboard with a short delay to display the success state
  useEffect(() => {
    if (isConnected && account) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isConnected, account, navigate]);


  const [ssoMode, setSsoMode] = useState(false);
  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoPassword, setSsoPassword] = useState('');
  const [ssoError, setSsoError] = useState(null);

  /* ─── Handle MetaMask connection and redirect ─── */
  const handleDigitalAuth = async () => {
    await connectWallet();
  };

  /* ─── SSO Login handler (placeholder) ─── */
  const handleSSOLogin = (e) => {
    e.preventDefault();
    setSsoError('SSO integration pending. Backend connection required (Member 2).');
  };

  return (
    <div className="relative min-h-screen bg-terminal-light flex flex-col">
      {/* ─── NODE_STATUS Floating Indicator ─── */}
      <div className="hidden lg:block fixed left-8 top-1/3">
        <div className="protocol-card p-3 w-36">
          <p className="text-[10px] font-mono text-terminal-grey uppercase mb-2">
            Node_Status
          </p>
          <div className="space-y-1.5">
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-1.5 bg-terminal-black rounded-full w-3/4" />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-1.5 bg-terminal-black rounded-full w-1/2" />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-1.5 bg-protocol-blue rounded-full w-5/6" />
            </div>
          </div>
        </div>

        <div className="mt-6 text-[11px] font-mono text-terminal-grey/40 uppercase leading-relaxed">
          <p>Vote</p>
          <p>Secure</p>
          <p>Audit</p>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* ─── Auth Card ─── */}
          <div className="protocol-card-strong">
            {/* ─── Header Bar ─── */}
            <div className="bg-terminal-black text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-terminal-grey rounded-full" />
                <span className="w-2 h-2 bg-terminal-grey rounded-full" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-protocol">
                System.Auth_V4.2.0
              </span>
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>

            {/* ─── Card Body ─── */}
            <div className="px-8 py-10 space-y-8">
              {/* Brand */}
              <div className="text-center">
                <h1 className="protocol-heading text-4xl sm:text-5xl">
                  CIPHERBALLOT
                </h1>
                <p className="protocol-label mt-3 text-[11px]">
                  Decentralized CipherBallot Access Protocol
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2">
                <div className="protocol-divider" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-active status-dot-live" />
                <span className="text-xs font-medium text-terminal-grey uppercase tracking-wide">
                  Identity Provider: Active
                </span>
              </div>

              {/* ─── Connected State ─── */}
              {isConnected && account && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 animate-slide-up">
                  <svg className="w-5 h-5 text-status-active" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-status-active uppercase tracking-wide">
                      Wallet Connected
                    </p>
                    <p className="font-mono text-xs text-green-600 mt-0.5">
                      {account.slice(0, 10)}...{account.slice(-8)}
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Error State ─── */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 animate-slide-up">
                  <svg className="w-5 h-5 text-status-halted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H4.075c1.73 0 2.813-1.874 1.948-3.374L10.05 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-status-halted">{error}</p>
                </div>
              )}

              {/* ─── SSO Form (Toggle) ─── */}
              {ssoMode ? (
                <form onSubmit={handleSSOLogin} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="protocol-label mb-1.5 block">Institutional Email</label>
                    <input
                      type="email"
                      value={ssoEmail}
                      onChange={(e) => setSsoEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full px-4 py-3 border border-terminal-black/20 font-mono text-sm focus:outline-none focus:border-terminal-black transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="protocol-label mb-1.5 block">Credential</label>
                    <input
                      type="password"
                      value={ssoPassword}
                      onChange={(e) => setSsoPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-terminal-black/20 font-mono text-sm focus:outline-none focus:border-terminal-black transition-colors"
                      required
                    />
                  </div>
                  {ssoError && (
                    <p className="text-xs text-status-halted">{ssoError}</p>
                  )}
                  <button type="submit" className="btn-protocol-primary w-full">
                    Authenticate
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSsoMode(false); setSsoError(null); }}
                    className="text-xs text-terminal-grey hover:text-terminal-black transition-colors w-full text-center uppercase tracking-protocol"
                  >
                    ← Back to Digital Signature
                  </button>
                </form>
              ) : (
                <>
                  {/* ─── Digital Signature Auth Button ─── */}
                  {!isConnected && (
                    <button
                      onClick={handleDigitalAuth}
                      disabled={isConnecting}
                      className="btn-protocol-primary w-full py-5 text-base relative"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                            />
                          </svg>
                          Digital Signature Authentication
                        </>
                      )}
                    </button>
                  )}

                  {/* ─── Protocol Instructions ─── */}
                  <div className="border border-terminal-black/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-protocol text-terminal-black mb-4">
                      Protocol Instructions
                    </p>
                    <div className="space-y-3">
                      {[
                        'Authenticate Institutional Identity',
                        'Sign Governance Handshake',
                        'Access Secure Voting Terminal',
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-sm font-bold text-terminal-black min-w-[28px]">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <span className="text-xs uppercase tracking-wide text-terminal-grey">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── SSO / Physical Credential Button ─── */}
                  <button
                    onClick={() => setSsoMode(true)}
                    className="btn-protocol-secondary w-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                      />
                    </svg>
                    Access Via Physical Credential
                  </button>
                </>
              )}

              {/* ─── Disclaimer ─── */}
              <div className="protocol-divider" />
              <p className="text-[10px] text-terminal-grey leading-relaxed uppercase text-center">
                By accessing this terminal, you acknowledge that all actions are
                immutable and recorded on the quantum-ledger. Unauthorized access
                attempts will be logged and referred to the civil security audit board.
              </p>

              {/* ─── MetaMask Not Installed Warning ─── */}
              {!isMetaMaskInstalled && !ssoMode && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H4.075c1.73 0 2.813-1.874 1.948-3.374L10.05 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-[10px] text-amber-700">
                    MetaMask extension not detected. Install MetaMask to proceed with digital signature authentication.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
