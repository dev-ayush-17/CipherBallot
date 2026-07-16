import { useEffect } from 'react';

/*
 * VoteModal — Vote Confirmation Modal
 * Bordered document-style modal that appears when a voter selects a candidate.
 *
 * Props:
 *   - isOpen: boolean
 *   - candidate: { id, name, department } | null
 *   - electionName: string
 *   - txStatus: null | 'pending' | 'confirmed' | 'failed'
 *   - txHash: string | null
 *   - error: string | null
 *   - onConfirm: () => void — triggers the vote transaction
 *   - onClose: () => void — closes the modal
 */

export default function VoteModal({
  isOpen,
  candidate,
  electionName,
  txStatus,
  txHash,
  error,
  onConfirm,
  onClose,
}) {
  /* ─── Lock body scroll when modal is open ─── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const formatTxHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ─── Backdrop ─── */}
      <div
        className="absolute inset-0 bg-terminal-black/50 animate-fade-in"
        onClick={txStatus === 'pending' ? undefined : onClose}
      />

      {/* ─── Modal Card ─── */}
      <div className="relative bg-white border-2 border-terminal-black w-full max-w-lg animate-slide-up">
        {/* ─── Header Bar ─── */}
        <div className="bg-terminal-black text-white px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-protocol">
            Ballot Confirmation
          </span>
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* ─── Body ─── */}
        <div className="p-6 space-y-6">
          {/* Election Info */}
          <div>
            <p className="protocol-label mb-1">Election</p>
            <p className="protocol-data text-base">{electionName || 'Current Election'}</p>
          </div>

          <div className="protocol-divider" />

          {/* Candidate Info */}
          <div>
            <p className="protocol-label mb-1">Candidate Selected</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-terminal-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-terminal-black">{candidate.name}</p>
                <p className="text-xs text-terminal-grey">{candidate.department}</p>
              </div>
            </div>
          </div>

          <div className="protocol-divider" />

          {/* Warning */}
          {!txStatus && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Immutable Action
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  This ballot will be permanently recorded on the blockchain. 
                  This action cannot be undone or modified once confirmed.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txStatus === 'pending' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200">
              <div className="w-5 h-5 border-2 border-protocol-blue border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-xs font-semibold text-protocol-blue uppercase tracking-wide">
                  Transaction Pending
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Awaiting blockchain confirmation. Please do not close this window.
                </p>
              </div>
            </div>
          )}

          {txStatus === 'confirmed' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200">
              <svg className="w-5 h-5 text-status-active" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-status-active uppercase tracking-wide">
                  Ballot Confirmed
                </p>
                {txHash && (
                  <p className="font-mono text-xs text-green-600 mt-1">
                    TX: {formatTxHash(txHash)}
                  </p>
                )}
              </div>
            </div>
          )}

          {txStatus === 'failed' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200">
              <svg className="w-5 h-5 text-status-halted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-status-halted uppercase tracking-wide">
                  Transaction Failed
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {error || 'An error occurred. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Actions ─── */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          {!txStatus && (
            <>
              <button
                onClick={onConfirm}
                className="btn-protocol-primary flex-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                Confirm Ballot
              </button>
              <button
                onClick={onClose}
                className="btn-protocol-secondary flex-1"
              >
                Cancel
              </button>
            </>
          )}

          {txStatus === 'confirmed' && (
            <button onClick={onClose} className="btn-protocol-primary w-full">
              Continue
            </button>
          )}

          {txStatus === 'failed' && (
            <div className="flex gap-3 w-full">
              <button onClick={onConfirm} className="btn-protocol-primary flex-1">
                Retry
              </button>
              <button onClick={onClose} className="btn-protocol-secondary flex-1">
                Close
              </button>
            </div>
          )}
        </div>

        {/* ─── Bottom Disclaimer ─── */}
        <div className="px-6 pb-4">
          <p className="text-[10px] text-terminal-grey leading-relaxed uppercase">
            By confirming, you acknowledge that all actions are immutable and 
            recorded on the quantum-ledger. Unauthorized attempts will be logged.
          </p>
        </div>
      </div>
    </div>
  );
}
