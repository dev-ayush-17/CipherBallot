import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import useMetaMask from '../hooks/useMetaMask';
import useVotingContract from '../hooks/useVotingContract';

/*
 * Results.jsx — Ledger & Live Vote Distribution Dashboard
 * Redesigned to match the "CIVIC TERMINAL / LEDGER" layout.
 *
 * Features:
 *   - Consistency sidebar with menu items (Ledger active)
 *   - Node status strip: Active status, Block sync ID
 *   - Network Metrics cards: Ballots cast, turnout, live epoch countdown
 *   - Live Ledger Feed: Dynamic interval simulating incoming blockchain blocks
 *   - Live Vote Distribution progress bars for Julian A. Vane and Elena Rossi
 *   - Integrated Ballot Receipt certificate in an interactive modal overlay
 */

/* ─── Mock results data matching the inspiration ─── */
const MOCK_TOTAL_BALLOTS = 1245892;
const MOCK_TURNOUT = 68.4;
const MOCK_CANDIDATE_VOTES = [
  { id: 1, name: 'Julian A. Vane', votes: 675273, delegates: 1420, fillClass: 'bg-protocol-blue', pct: 54.2 },
  { id: 2, name: 'Elena Rossi', votes: 570619, delegates: 1185, fillClass: 'bg-slate-500', pct: 45.8 }
];

export default function Results() {
  const { account, isConnected } = useMetaMask();
  const {
    candidates: contractCandidates,
    electionName: contractElectionName,
    hasVoted,
    totalVotesCast: contractTotalVotes,
    txHash: contractTxHash,
  } = useVotingContract(account);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 12, seconds: 45 });
  const [blocks, setBlocks] = useState([
    { status: 'VERIFIED', hash: '0x8f4c...9a2b', time: '12s ago', isPending: false },
    { status: 'VERIFIED', hash: '0x3e1d...7c4f', time: '45s ago', isPending: false },
    { status: 'VERIFIED', hash: '0x9a8b...2d1e', time: '1m 12s ago', isPending: false },
    { status: 'PENDING', hash: '0x5f6g...8h9i', time: '1m 30s ago', isPending: true },
    { status: 'VERIFIED', hash: '0x1a2b...3c4d', time: '2m 05s ago', isPending: false }
  ]);

  /* ─── Live Epoch countdown timer ─── */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 12, seconds: 45 }; // Reset epoch loop
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ─── Live block feed generator simulation ─── */
  useEffect(() => {
    const blockTimer = setInterval(() => {
      // Simulate adding a block/transaction
      const hex = '0x' + Math.random().toString(16).slice(2, 6) + '...' + Math.random().toString(16).slice(2, 6);
      setBlocks((prev) => {
        const list = [...prev];
        // Resolve previously pending block
        const pendingIdx = list.findIndex((b) => b.isPending);
        if (pendingIdx !== -1) {
          list[pendingIdx] = { ...list[pendingIdx], status: 'VERIFIED', isPending: false, time: '1s ago' };
        }
        // Add new pending block
        list.unshift({ status: 'PENDING', hash: hex, time: 'just now', isPending: true });
        // Cap feed size
        return list.slice(0, 6);
      });
    }, 15000);
    return () => clearInterval(blockTimer);
  }, []);

  /* ─── Determine layout details ─── */
  const electionName = contractElectionName || '2024 Global Council Assembly';
  const totalVotes = contractTotalVotes || MOCK_TOTAL_BALLOTS;
  const txHash = contractTxHash || '0x7F9c2eB...a1d94...4f1B9c';
  const timestamp = new Date().toISOString();

  const formattedCountdown = `${countdown.hours.toString().padStart(2, '0')}h ${countdown.minutes.toString().padStart(2, '0')}m ${countdown.seconds.toString().padStart(2, '0')}s`;

  return (
    <div className="flex min-h-[calc(100vh-112px)]">
      {/* ─── Sidebar ─── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col justify-between">
        <div>
          {/* Header block */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-base font-brand font-bold text-terminal-black">
              Institutional ID
            </h2>
            <p className="text-[10px] font-mono text-terminal-grey mt-0.5">Verified Delegate</p>
          </div>

          {/* Sidebar Tabs */}
          <nav className="p-4 space-y-1">
            <Link
              to="/dashboard"
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-protocol text-terminal-grey hover:text-terminal-black hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Dashboard
            </Link>
            <Link
              to="/dashboard"
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-protocol text-terminal-grey hover:text-terminal-black hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Analytics
            </Link>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-protocol bg-protocol-blue text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Ledger
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-protocol text-terminal-grey hover:text-terminal-black hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Resources
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-4">
          <button className="w-full btn-protocol-primary py-3 text-[10px]">
            Initiate Proposal
          </button>
          <div className="flex justify-between text-[11px] text-terminal-grey px-2">
            <a href="#help" className="hover:text-terminal-black">Help Center</a>
            <span>•</span>
            <a href="#support" className="hover:text-terminal-black">Support</a>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 lg:p-8 max-w-5xl space-y-8 animate-fade-in">
        {/* Node Status Sub-header strip */}
        <div className="protocol-card border-terminal-black/20 p-3 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-700 rounded-sm inline-block" />
            <span className="font-bold text-terminal-black">Node Status: Active</span>
          </div>
          <span className="text-terminal-grey uppercase">Mainnet Synchronized</span>
          <span className="text-terminal-black">Block: #894,122</span>
        </div>

        {/* Voter receipt quick action (if voted) */}
        {hasVoted && (
          <div className="protocol-card p-4 border-protocol-blue/30 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-protocol-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-bold text-terminal-black uppercase tracking-protocol">Your Ballot Receipt is Ready</p>
                <p className="text-[11px] text-terminal-grey mt-0.5">Secure, cryptographically signed ledger certificate.</p>
              </div>
            </div>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="btn-protocol-secondary py-2 px-5 text-[10px] w-full sm:w-auto"
            >
              View Receipt Certificate
            </button>
          </div>
        )}

        {/* Network Metrics & Live Ledger Feed Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Network Metrics Container */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-brand font-black text-terminal-black">
              Network Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Ballots Cast */}
              <div className="protocol-card bg-white p-5 space-y-2">
                <p className="protocol-label text-[9px]">Total Ballots Cast</p>
                <p className="font-mono text-3xl font-black text-terminal-black">
                  {totalVotes.toLocaleString()}
                </p>
              </div>

              {/* Network Turnout */}
              <div className="protocol-card bg-white p-5 space-y-2">
                <p className="protocol-label text-[9px]">Network Turnout</p>
                <p className="font-mono text-3xl font-black text-terminal-black">
                  {MOCK_TURNOUT}%
                </p>
              </div>

              {/* Next Epoch Countdown */}
              <div className="protocol-card bg-white p-5 space-y-2">
                <p className="protocol-label text-[9px]">Next Epoch In</p>
                <p className="font-mono text-xl font-bold text-terminal-black mt-1">
                  {formattedCountdown}
                </p>
              </div>
            </div>
          </div>

          {/* Live Ledger Feed List */}
          <div className="protocol-card bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-terminal-black/10 pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-protocol text-terminal-black">
                  Live Ledger Feed
                </h3>
                <span className="w-2.5 h-2.5 bg-protocol-blue rounded-sm animate-pulse-slow" />
              </div>

              {/* Feed items */}
              <div className="space-y-3">
                {blocks.map((block, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-mono border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-1.5">
                      {block.isPending ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-status-pending status-dot-live" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-status-active" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`font-semibold uppercase ${block.isPending ? 'text-status-pending' : 'text-status-active'}`}>
                        {block.status}
                      </span>
                      <span className="text-terminal-black">{block.hash}</span>
                    </div>
                    <span className="text-terminal-grey">{block.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="#ledger"
              className="text-center text-[10px] font-semibold uppercase tracking-protocol text-terminal-grey hover:text-terminal-black underline mt-4 block"
            >
              View Full Ledger
            </a>
          </div>
        </div>

        {/* Live Vote Distribution */}
        <div className="protocol-card bg-white p-6 space-y-6">
          <div className="border-b border-terminal-black/10 pb-4">
            <h2 className="text-base font-brand font-black text-terminal-black">
              Live Vote Distribution
            </h2>
          </div>

          <div className="space-y-6">
            {MOCK_CANDIDATE_VOTES.map((cand) => (
              <div key={cand.id} className="space-y-2">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-brand font-black text-lg text-terminal-black">{cand.name}</span>
                  <span className="font-mono font-bold text-protocol-blue">{cand.pct}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-8 bg-gray-100 border border-terminal-black/15 overflow-hidden">
                  <div
                    className={`h-full ${cand.fillClass} transition-all duration-1000`}
                    style={{ width: `${cand.pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-terminal-grey font-mono">
                  <span>Votes: {cand.votes.toLocaleString()}</span>
                  <span>Delegates: {cand.delegates.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Footer Copyright */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p className="font-semibold text-terminal-black uppercase tracking-protocol">
              Cipherballot Protocol V4.2.0
            </p>
            <div className="flex gap-6 text-terminal-grey">
              <a href="#" className="hover:text-terminal-black">Protocol Whitepaper</a>
              <a href="#" className="hover:text-terminal-black">Legal Disclosure</a>
              <a href="#" className="hover:text-terminal-black">Privacy Policy</a>
              <a href="#" className="hover:text-terminal-black">System Status</a>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Receipt Modal overlay (Voter digital receipt) ─── */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-terminal-black/50" onClick={() => setIsReceiptModalOpen(false)} />
          <div className="relative bg-white border-2 border-terminal-black w-full max-w-2xl p-6 sm:p-10 animate-slide-up">
            {/* Close */}
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-4 right-4 text-terminal-grey hover:text-terminal-black"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Receipt certificate content */}
            <div className="border border-dashed border-terminal-black/20 p-6 sm:p-8">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full border-2 border-protocol-blue flex items-center justify-center">
                  <svg className="w-6 h-6 text-protocol-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="protocol-heading text-2xl sm:text-3xl">BALLOT SUCCESSFULLY CAST</h1>
                <p className="text-xs text-terminal-grey mt-2 italic">Official Digital Certificate of Participation</p>
              </div>

              <div className="protocol-divider-strong mb-6" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4 text-left">
                  <div>
                    <p className="protocol-label text-[8px] mb-1">Election</p>
                    <p className="protocol-data font-semibold text-sm border border-terminal-black/10 px-3 py-2 bg-gray-50">{electionName}</p>
                  </div>
                  <div>
                    <p className="protocol-label text-[8px] mb-1">Candidate Selected</p>
                    <p className="protocol-data font-semibold text-sm border border-terminal-black/10 px-3 py-2 bg-gray-50">Julian A. Vane</p>
                  </div>
                  <div>
                    <p className="protocol-label text-[8px] mb-1">Transaction Hash</p>
                    <p className="protocol-data text-[10px] border border-terminal-black/10 px-3 py-2 bg-gray-50 break-all font-mono">{txHash}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <p className="protocol-label text-[8px]">Verification Key</p>
                  <div className="border border-terminal-black/10 p-2 bg-white inline-block">
                    <QRCodeSVG value={`cipherballot://verify?tx=${txHash}`} size={100} />
                  </div>
                </div>
              </div>

              <div className="protocol-divider mt-6 mb-4" />

              <div className="flex gap-4">
                <button className="btn-protocol-primary flex-1 py-3 text-xs">[Download PDF Receipt]</button>
                <button className="btn-protocol-secondary flex-1 py-3 text-xs">[View on Ledger]</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


