import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useMetaMask from '../hooks/useMetaMask';
import useVotingContract from '../hooks/useVotingContract';
import CandidateCard from '../components/Voter/CandidateCard';
import VoteModal from '../components/Voter/VoteModal';

/*
 * VoterDashboard.jsx — Student Voting Panel
 * Redesigned to implement the "Voter Matrix (Minimal)" layout.
 * Now connected to real on-chain data via useVotingContract.
 */

export default function VoterDashboard() {
  const { account, isConnected, disconnectWallet } = useMetaMask();
  const {
    elections,
    currentElection,
    currentElectionId,
    selectElection,
    candidates,
    electionPhase,
    electionName,
    hasVoted,
    isWhitelisted,
    loading,
    txStatus,
    txHash,
    error,
    castVote,
    resetTxStatus,
  } = useVotingContract(account);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Voter Identity');

  const displayCandidates = useMemo(() => {
    if (candidates.length === 0) return [];
    
    // Fallback portraits if none provided
    const portraitPool = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    ];

    return candidates.map((c, i) => {
      let manifestoData = { text: '', photoUrl: '', manifestoPhotoUrl: '' };
      
      try {
        if (c.manifestoURI) {
          const parsed = JSON.parse(c.manifestoURI);
          manifestoData = parsed;
        }
      } catch (e) {
        // If it's not JSON, it might be an old string URL
        manifestoData.text = c.manifestoURI;
      }

      const finalPortrait = manifestoData.photoUrl || portraitPool[i % portraitPool.length];

      return {
        ...c,
        role: i === 0 ? 'INCUMBENT' : 'CHALLENGER',
        portraitUrl: finalPortrait,
        manifestoPhotoUrl: manifestoData.manifestoPhotoUrl || null,
        tags: [`CGPA: ${c.cgpa}`, manifestoData.text ? 'Has Manifesto' : 'No Manifesto'],
        manifesto: manifestoData.text || 'No manifesto submitted.',
        isIncumbent: i === 0,
      };
    });
  }, [candidates]);

  /* ─── Sidebar menu list ─── */
  const sidebarItems = [
    {
      id: 'Voter Identity',
      label: 'Voter Identity',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 1.02.109 2.015.318 2.973m11.436-4.973a9.074 9.074 0 011.5 4.974c0 3.524-.863 6.848-2.392 9.77M12 11c0-2.424-.74-4.674-2-6.56C8.26 2.506 6.22 1.5 4 1.5M12 11a10.025 10.025 0 004.132-5.411M12 11c0-1.78.293-3.49.828-5.088A9.03 9.03 0 0115.908 3" />
        </svg>
      ),
    },
    {
      id: 'Ballot Status',
      label: 'Ballot Status',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
    },
    {
      id: 'Polling Station',
      label: 'Polling Station',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      id: 'Security Audit',
      label: 'Security Audit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
  ];

  /* ─── Format wallet address ─── */
  const formatAddress = (addr) => {
    if (!addr) return '0x0000...0000';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  /* ─── Format timestamp ─── */
  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts * 1000).toLocaleString();
  };

  /* ─── Open vote modal ─── */
  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
    resetTxStatus();
  };

  /* ─── Confirm vote ─── */
  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;
    await castVote(selectedCandidate.id);
  };

  /* ─── Close modal ─── */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCandidate(null);
    resetTxStatus();
  };

  return (
    <div className="flex min-h-[calc(100vh-112px)]">
      {/* ─── Mobile Sidebar Toggle ─── */}
      <button
        className="lg:hidden fixed bottom-4 left-4 z-40 bg-terminal-black text-white p-3 shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-200 
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Voter Identity Profile Block */}
        <div className="p-6 border-b border-gray-200 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-terminal-black mb-3 bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-terminal-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-base font-brand font-bold text-terminal-black">
            Verified Voter
          </h2>

          {/* Connection Status Badge */}
          {isConnected && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 border border-terminal-black/10 rounded-full bg-gray-50">
              <span className="w-1.5 h-1.5 rounded-full bg-status-active status-dot-live" />
              <span className="font-mono text-[9px] text-terminal-black">
                {formatAddress(account)}
              </span>
            </div>
          )}

          {/* Whitelist Status */}
          {currentElectionId && (
            <div className={`mt-2 text-[10px] font-mono uppercase tracking-wide ${isWhitelisted ? 'text-green-600' : 'text-amber-600'}`}>
              {isWhitelisted ? '✓ Whitelisted' : '⚠ Not Whitelisted'}
            </div>
          )}
        </div>

        {/* Election Selector */}
        {elections.length > 1 && (
          <div className="px-4 py-3 border-b border-gray-200">
            <label className="text-[10px] font-mono uppercase tracking-protocol text-terminal-grey block mb-1">
              Election
            </label>
            <select
              value={currentElectionId || ''}
              onChange={(e) => selectElection(Number(e.target.value))}
              className="w-full text-xs font-mono border border-terminal-black/15 px-2 py-1.5 focus:outline-none focus:border-terminal-black"
            >
              {elections.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.phase})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-protocol transition-all duration-150
                ${
                  activeTab === item.id
                    ? 'bg-protocol-blue text-white'
                    : 'text-terminal-grey hover:text-terminal-black hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            to="/results"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-protocol text-terminal-grey hover:text-terminal-black hover:bg-gray-50 transition-colors border border-terminal-black/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            View Results
          </Link>

          <button
            onClick={disconnectWallet}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-protocol text-terminal-grey hover:text-status-halted hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Backdrop ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 lg:p-8 max-w-5xl">
        {activeTab === 'Voter Identity' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="protocol-heading text-4xl leading-none">Voter Matrix</h1>
              <p className="text-sm text-terminal-grey mt-3 leading-relaxed max-w-2xl">
                {currentElection
                  ? `${currentElection.name} — ${currentElection.phase} Phase`
                  : 'No elections found. Waiting for admin to create one.'}
              </p>
              {currentElection && (
                <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-mono text-terminal-grey uppercase">
                  <span>Start: {formatTime(currentElection.startTime)}</span>
                  <span>End: {formatTime(currentElection.endTime)}</span>
                  <span>Candidates: {currentElection.candidateCount}</span>
                  <span className={`font-bold ${electionPhase === 'Active' ? 'text-green-600' : electionPhase === 'Ended' ? 'text-red-500' : 'text-amber-600'}`}>
                    {electionPhase}
                  </span>
                </div>
              )}
              <div className="protocol-divider-strong mt-6" />
            </div>

            {/* No election state */}
            {!currentElection && !loading && (
              <div className="protocol-card p-8 bg-white text-center">
                <svg className="w-12 h-12 mx-auto text-terminal-grey/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p className="text-sm text-terminal-grey">No elections have been created yet.</p>
                <p className="text-xs text-terminal-grey/60 mt-1">An admin must create an election first.</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 animate-slide-up">
                <svg className="w-5 h-5 text-status-halted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H4.075c1.73 0 2.813-1.874 1.948-3.374L10.05 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-status-halted">{error}</p>
              </div>
            )}

            {/* Candidate Grid */}
            {currentElection && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  <div className="md:col-span-3 flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-protocol-blue border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-terminal-grey">Loading candidates...</span>
                  </div>
                ) : displayCandidates.length > 0 ? (
                  displayCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onVote={handleVoteClick}
                      hasVoted={hasVoted}
                      disabled={electionPhase !== 'Active' || !isWhitelisted}
                    />
                  ))
                ) : (
                  <div className="md:col-span-3 text-center py-12">
                    <p className="text-sm text-terminal-grey">No candidates registered yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom widgets */}
            {currentElection && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Election Status Card */}
                <div className="bg-protocol-blue text-white p-6 relative flex flex-col justify-between min-h-[160px]">
                  <p className="text-[10px] font-bold uppercase tracking-protocol opacity-80">
                    Election Status
                  </p>
                  <h3 className="font-mono text-3xl font-black mt-2">
                    {electionPhase}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wide opacity-75 mt-auto">
                    {displayCandidates.length} candidates • {hasVoted ? 'Vote Cast ✓' : 'Vote Pending'}
                  </p>
                </div>

                {/* Voter Status Card */}
                <div className="protocol-card bg-white p-6 md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol">
                    Your Voter Status
                  </h3>
                  <div className="protocol-divider" />
                  <div className="space-y-3">
                    {[
                      { label: 'Wallet Connected', status: isConnected },
                      { label: 'Whitelisted for Election', status: isWhitelisted },
                      { label: 'Vote Cast', status: hasVoted },
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-xs">
                        <span className="font-semibold text-terminal-black">{row.label}</span>
                        <span className={`w-6 h-6 border flex items-center justify-center transition-colors ${
                          row.status
                            ? 'bg-protocol-blue border-protocol-blue text-white'
                            : 'bg-gray-100 border-terminal-black/10'
                        }`}>
                          {row.status && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Placeholder for other tabs */
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="protocol-heading text-3xl">{activeTab}</h1>
              <p className="text-sm text-terminal-grey mt-2">CipherBallot Information Hub</p>
              <div className="protocol-divider-strong mt-4" />
            </div>

            <div className="protocol-card p-6 bg-white space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200">
                <svg className="w-5 h-5 text-terminal-grey flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-terminal-black uppercase tracking-wide">
                    Information Node
                  </p>
                  <p className="text-xs text-terminal-grey mt-1">
                    Details for the {activeTab} section are being processed on-chain.
                  </p>
                </div>
              </div>

              {activeTab === 'Ballot Status' && currentElection && (
                <div className="space-y-3">
                  <div className="p-4 border border-terminal-black/15">
                    <p className="protocol-label text-[10px]">Election</p>
                    <p className="protocol-data text-sm font-semibold">{electionName}</p>
                    <p className="protocol-label text-[10px] mt-3">Status</p>
                    <span className={hasVoted ? 'badge-active' : 'badge-pending'}>
                      {hasVoted ? 'BALLOT CAST' : 'PENDING ACTION'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs font-semibold text-terminal-black">
              © 2026 CipherBallot Institutional. Immutable Voting Protocol.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-terminal-grey hover:text-terminal-black transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-terminal-grey hover:text-terminal-black transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Vote Modal ─── */}
      <VoteModal
        isOpen={isModalOpen}
        candidate={selectedCandidate}
        electionName={electionName || 'Election'}
        txStatus={txStatus}
        txHash={txHash}
        error={error}
        onConfirm={handleConfirmVote}
        onClose={handleCloseModal}
      />
    </div>
  );
}
