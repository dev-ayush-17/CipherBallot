import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useMetaMask from '../hooks/useMetaMask';
import useAdminContract from '../hooks/useAdminContract';
import useVotingContract from '../hooks/useVotingContract';
import api from '../utils/api';

/*
 * AdminDashboard.jsx — Election Committee Admin Panel
 * Allows admins to:
 *   - Create elections (on-chain)
 *   - Register candidates (on-chain with CGPA/backlog validation)
 *   - Whitelist voter addresses (on-chain)
 *   - Start / End elections (on-chain)
 */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet } = useMetaMask();
  const {
    checkIsAdmin,
    checkIsOwner,
    createElection,
    startElection,
    endElection,
    registerCandidate,
    whitelistVoters,
    addAdmin,
    removeAdmin,
    resetTx,
    loading: adminLoading,
    txStatus,
    txHash,
    error: adminError,
  } = useAdminContract(account);

  const {
    elections,
    currentElection,
    currentElectionId,
    selectElection,
    candidates,
    electionPhase,
    refreshData,
    loading: dataLoading,
  } = useVotingContract(account);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [backendAdmin, setBackendAdmin] = useState(null);
  const [activeSection, setActiveSection] = useState('elections');
  const [successMsg, setSuccessMsg] = useState('');
  const [adminAddressForm, setAdminAddressForm] = useState('');

  // ─── Backend Login form state ─────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // ─── Election form state ──────────────────────────────────────────────
  const [electionForm, setElectionForm] = useState({
    name: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // ─── Candidate form state ─────────────────────────────────────────────
  const [candidateForm, setCandidateForm] = useState({
    electionId: '',
    name: '',
    manifestoText: '',
    cgpa: '',
    hasBacklogs: false,
  });
  const [candidatePhoto, setCandidatePhoto] = useState(null);
  const [manifestoPhoto, setManifestoPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ─── Whitelist form state ─────────────────────────────────────────────
  const [whitelistForm, setWhitelistForm] = useState({
    electionId: '',
    addresses: '',
  });

  // ─── Check admin status ───────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      if (account) {
        const admin = await checkIsAdmin();
        setIsAdmin(admin);
        
        const owner = await checkIsOwner();
        setIsOwner(owner);
        
        setAdminChecked(true);
      }
    };
    check();
  }, [account, checkIsAdmin, checkIsOwner]);

  // ─── Auto-clear success message ───────────────────────────────────────
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    resetTx();
    if (!adminAddressForm.startsWith('0x') || adminAddressForm.length !== 42) {
      alert('Please enter a valid Ethereum address.');
      return;
    }
    const result = await addAdmin(adminAddressForm);
    if (result) {
      setSuccessMsg(`Address ${adminAddressForm} is now an Admin!`);
      setAdminAddressForm('');
    }
  };

  const handleRemoveAdmin = async (e) => {
    e.preventDefault();
    resetTx();
    if (!adminAddressForm.startsWith('0x') || adminAddressForm.length !== 42) {
      alert('Please enter a valid Ethereum address.');
      return;
    }
    const result = await removeAdmin(adminAddressForm);
    if (result) {
      setSuccessMsg(`Address ${adminAddressForm} is no longer an Admin.`);
      setAdminAddressForm('');
    }
  };

  const handleBackendLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await api.post('/auth/admin/login', loginForm);
      if (response.data.data?.token) {
        localStorage.setItem('cipherballot_token', response.data.data.token);
        setBackendAdmin(response.data.data.admin);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    resetTx();

    const startTimestamp = Math.floor(new Date(`${electionForm.startDate}T${electionForm.startTime}`).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(`${electionForm.endDate}T${electionForm.endTime}`).getTime() / 1000);

    if (endTimestamp <= startTimestamp) {
      alert('End time must be after start time.');
      return;
    }

    const result = await createElection(electionForm.name, startTimestamp, endTimestamp);
    if (result) {
      setSuccessMsg(`Election created successfully! ID: ${result}`);
      setElectionForm({ name: '', startDate: '', startTime: '', endDate: '', endTime: '' });
      await refreshData();
    }
  };

  const uploadToPinata = async (file) => {
    const jwt = import.meta.env.VITE_PINATA_JWT;
    
    if (!jwt) {
      throw new Error('Pinata JWT missing in .env (VITE_PINATA_JWT)');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`https://api.pinata.cloud/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload image to Pinata IPFS');
    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  };

  const handleRegisterCandidate = async (e) => {
    e.preventDefault();
    resetTx();

    const cgpa = parseFloat(candidateForm.cgpa);
    if (isNaN(cgpa) || cgpa < 7.5) {
      alert('CGPA must be at least 7.5');
      return;
    }

    try {
      setIsUploading(true);
      let photoUrl = '';
      let manifestoPhotoUrl = '';
      
      if (candidatePhoto) {
        photoUrl = await uploadToPinata(candidatePhoto);
      }
      if (manifestoPhoto) {
        manifestoPhotoUrl = await uploadToPinata(manifestoPhoto);
      }

      const manifestoPayload = JSON.stringify({
        text: candidateForm.manifestoText,
        photoUrl,
        manifestoPhotoUrl
      });

      const result = await registerCandidate(
        Number(candidateForm.electionId),
        candidateForm.name,
        manifestoPayload,
        cgpa,
        candidateForm.hasBacklogs
      );

      if (result) {
        setSuccessMsg(`Candidate "${candidateForm.name}" registered successfully!`);
        setCandidateForm({ electionId: candidateForm.electionId, name: '', manifestoText: '', cgpa: '', hasBacklogs: false });
        setCandidatePhoto(null);
        setManifestoPhoto(null);
        // Clear file inputs manually
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');
        await refreshData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleWhitelist = async (e) => {
    e.preventDefault();
    resetTx();

    const addresses = whitelistForm.addresses
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter((a) => a.startsWith('0x') && a.length === 42);

    if (addresses.length === 0) {
      alert('Please enter valid Ethereum addresses (0x...)');
      return;
    }

    const result = await whitelistVoters(Number(whitelistForm.electionId), addresses);
    if (result) {
      setSuccessMsg(`${addresses.length} voter(s) whitelisted successfully!`);
      setWhitelistForm({ ...whitelistForm, addresses: '' });
    }
  };

  const handleStartElection = async (electionId) => {
    resetTx();
    const result = await startElection(electionId);
    if (result) {
      setSuccessMsg('Election started! Voting is now active.');
      await refreshData();
    }
  };

  const handleEndElection = async (electionId) => {
    resetTx();
    const result = await endElection(electionId);
    if (result) {
      setSuccessMsg('Election ended. Results are now final.');
      await refreshData();
    }
  };

  // ─── Not authenticated on backend ─────────────────────────────────────
  if (!backendAdmin) {
    return (
      <div className="min-h-screen bg-terminal-light flex items-center justify-center px-4">
        <div className="protocol-card-strong w-full max-w-md">
          <div className="bg-terminal-black text-white px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-protocol">Admin.Auth</span>
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="px-8 py-10 space-y-6">
            <div className="text-center">
              <h1 className="protocol-heading text-3xl">Admin Login</h1>
              <p className="text-xs text-terminal-grey mt-2">Authenticate with institutional credentials first.</p>
            </div>
            <form onSubmit={handleBackendLogin} className="space-y-4">
              <div>
                <label className="protocol-label mb-1.5 block">Admin Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-terminal-black/20 font-mono text-sm focus:outline-none focus:border-terminal-black"
                  required
                />
              </div>
              <div>
                <label className="protocol-label mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-terminal-black/20 font-mono text-sm focus:outline-none focus:border-terminal-black"
                  required
                />
              </div>
              {loginError && <p className="text-xs text-status-halted">{loginError}</p>}
              <button type="submit" className="btn-protocol-primary w-full mt-2">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not connected ────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-terminal-light flex items-center justify-center px-4">
        <div className="protocol-card-strong w-full max-w-md">
          <div className="bg-terminal-black text-white px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-protocol">Admin.Auth</span>
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="px-8 py-10 text-center space-y-6">
            <h1 className="protocol-heading text-3xl">Admin Access</h1>
            <p className="text-xs text-terminal-grey">Connect your admin wallet to access the Election Committee dashboard.</p>
            <button onClick={connectWallet} className="btn-protocol-primary w-full py-4">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not admin ────────────────────────────────────────────────────────
  if (adminChecked && !isAdmin) {
    return (
      <div className="min-h-screen bg-terminal-light flex items-center justify-center px-4">
        <div className="protocol-card p-8 max-w-md text-center space-y-4">
          <svg className="w-12 h-12 mx-auto text-status-halted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <h2 className="protocol-heading text-2xl">Access Denied</h2>
          <p className="text-xs text-terminal-grey font-mono">
            Wallet {account?.slice(0, 10)}...{account?.slice(-6)} is not an admin.
          </p>
          <p className="text-xs text-terminal-grey">
            Only the contract owner or designated admins can access this dashboard.
          </p>
          <button onClick={() => navigate('/')} className="btn-protocol-secondary w-full">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────
  const sections = [
    { id: 'elections', label: 'Elections', icon: '🗳️' },
    { id: 'candidates', label: 'Candidates', icon: '👤' },
    { id: 'whitelist', label: 'Whitelist', icon: '📋' },
  ];
  if (isOwner) {
    sections.push({ id: 'management', label: 'Admin Mgmt', icon: '⚙️' });
  }

  return (
    <div className="min-h-screen bg-terminal-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="protocol-heading text-4xl leading-none">Admin Terminal</h1>
            <p className="text-xs font-mono text-terminal-grey mt-2 uppercase tracking-protocol">
              Election Committee Dashboard • {account?.slice(0, 10)}...{account?.slice(-6)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-active status-dot-live" />
            <span className="text-[10px] font-mono uppercase text-terminal-grey">Admin Verified</span>
          </div>
        </div>

        <div className="protocol-divider-strong mb-6" />

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 animate-slide-up">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-green-700">{successMsg}</p>
          </div>
        )}

        {adminError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 animate-slide-up">
            <svg className="w-5 h-5 text-status-halted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H4.075c1.73 0 2.813-1.874 1.948-3.374L10.05 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-status-halted">{adminError}</p>
          </div>
        )}

        {txHash && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700 font-mono">
              Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 20)}...</a>
              {txStatus === 'pending' && ' (pending...)'}
              {txStatus === 'confirmed' && ' ✓'}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-5 py-3 text-xs font-semibold uppercase tracking-protocol transition-all ${
                activeSection === s.id
                  ? 'bg-terminal-black text-white'
                  : 'bg-white border border-terminal-black/15 text-terminal-grey hover:text-terminal-black'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ─── Elections Section ─── */}
        {activeSection === 'elections' && (
          <div className="space-y-6 animate-fade-in">
            {/* Create Election Form */}
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">Create New Election</h3>
              <div className="protocol-divider mb-4" />
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Election Name</label>
                  <input
                    type="text"
                    value={electionForm.name}
                    onChange={(e) => setElectionForm({ ...electionForm, name: e.target.value })}
                    placeholder="e.g. Student Council Election 2026"
                    className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="protocol-label text-[10px] block mb-1">Start Date</label>
                    <input type="date" value={electionForm.startDate} onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })} className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                  </div>
                  <div>
                    <label className="protocol-label text-[10px] block mb-1">Start Time</label>
                    <input type="time" value={electionForm.startTime} onChange={(e) => setElectionForm({ ...electionForm, startTime: e.target.value })} className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                  </div>
                  <div>
                    <label className="protocol-label text-[10px] block mb-1">End Date</label>
                    <input type="date" value={electionForm.endDate} onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })} className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                  </div>
                  <div>
                    <label className="protocol-label text-[10px] block mb-1">End Time</label>
                    <input type="time" value={electionForm.endTime} onChange={(e) => setElectionForm({ ...electionForm, endTime: e.target.value })} className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                  </div>
                </div>
                <button type="submit" disabled={adminLoading} className="btn-protocol-primary px-8 py-3">
                  {adminLoading ? 'Creating...' : 'Create Election (On-Chain)'}
                </button>
              </form>
            </div>

            {/* Existing Elections List */}
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">
                Existing Elections ({elections.length})
              </h3>
              <div className="protocol-divider mb-4" />
              {elections.length === 0 ? (
                <p className="text-xs text-terminal-grey">No elections created yet.</p>
              ) : (
                <div className="space-y-3">
                  {elections.map((election) => (
                    <div key={election.id} className="flex items-center justify-between p-4 border border-terminal-black/10 hover:border-terminal-black/25 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-terminal-black">{election.name}</p>
                        <p className="text-[10px] font-mono text-terminal-grey mt-1">
                          ID: {election.id} • {election.candidateCount} candidates •
                          {new Date(election.startTime * 1000).toLocaleDateString()} – {new Date(election.endTime * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono uppercase px-2 py-1 border ${
                          election.phase === 'Active' ? 'text-green-600 border-green-200 bg-green-50' :
                          election.phase === 'Ended' ? 'text-gray-600 border-gray-200 bg-gray-50' :
                          'text-amber-600 border-amber-200 bg-amber-50'
                        }`}>
                          {election.phase}
                        </span>
                        {election.phase === 'Setup' && (
                          <button onClick={() => handleStartElection(election.id)} disabled={adminLoading} className="text-[10px] font-mono uppercase px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition-colors">
                            Start
                          </button>
                        )}
                        {election.phase === 'Active' && (
                          <button onClick={() => handleEndElection(election.id)} disabled={adminLoading} className="text-[10px] font-mono uppercase px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors">
                            End
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Candidates Section ─── */}
        {activeSection === 'candidates' && (
          <div className="space-y-6 animate-fade-in">
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">Register Candidate (On-Chain)</h3>
              <div className="protocol-divider mb-4" />
              <form onSubmit={handleRegisterCandidate} className="space-y-4">
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Election</label>
                  <select
                    value={candidateForm.electionId}
                    onChange={(e) => setCandidateForm({ ...candidateForm, electionId: e.target.value })}
                    className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black"
                    required
                  >
                    <option value="">Select election...</option>
                    {elections.filter((e) => e.phase === 'Setup').map((e) => (
                      <option key={e.id} value={e.id}>{e.name} (Setup)</option>
                    ))}
                  </select>
                  {elections.filter((e) => e.phase === 'Setup').length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">⚠ No elections in Setup phase. Candidates can only be added during Setup.</p>
                  )}
                </div>
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Candidate Name</label>
                  <input type="text" value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} placeholder="Full name" className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                </div>
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Candidate Portrait (Pinata IPFS)</label>
                  <input type="file" accept="image/*" onChange={(e) => setCandidatePhoto(e.target.files[0])} className="w-full px-4 py-2 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black bg-white" />
                </div>
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Manifesto Image (Pinata IPFS)</label>
                  <input type="file" accept="image/*" onChange={(e) => setManifestoPhoto(e.target.files[0])} className="w-full px-4 py-2 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black bg-white" />
                </div>
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Manifesto Text Snippet</label>
                  <textarea value={candidateForm.manifestoText} onChange={(e) => setCandidateForm({ ...candidateForm, manifestoText: e.target.value })} placeholder="Brief description of the candidate's goals..." className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black resize-none" rows="2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="protocol-label text-[10px] block mb-1">CGPA (min 7.5)</label>
                    <input type="number" step="0.01" min="7.5" max="10" value={candidateForm.cgpa} onChange={(e) => setCandidateForm({ ...candidateForm, cgpa: e.target.value })} placeholder="8.50" className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black" required />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={candidateForm.hasBacklogs} onChange={(e) => setCandidateForm({ ...candidateForm, hasBacklogs: e.target.checked })} className="w-4 h-4" />
                      <span className="text-xs text-terminal-grey">Has Active Backlogs</span>
                    </label>
                  </div>
                </div>
                {candidateForm.hasBacklogs && (
                  <p className="text-[10px] text-status-halted">⚠ Candidates with backlogs cannot be registered (enforced on-chain).</p>
                )}
                <button type="submit" disabled={adminLoading || isUploading || candidateForm.hasBacklogs} className="btn-protocol-primary px-8 py-3">
                  {isUploading ? 'Uploading Images...' : adminLoading ? 'Registering...' : 'Register Candidate (On-Chain)'}
                </button>
              </form>
            </div>

            {/* Current Candidates */}
            {candidates.length > 0 && (
              <div className="protocol-card bg-white p-6">
                <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">
                  Registered Candidates ({candidates.length})
                </h3>
                <div className="protocol-divider mb-4" />
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 border border-terminal-black/10">
                      <div>
                        <p className="text-sm font-semibold text-terminal-black">{c.name}</p>
                        <p className="text-[10px] font-mono text-terminal-grey">CGPA: {c.cgpa} • Votes: {c.voteCount}</p>
                      </div>
                      <span className="text-[10px] font-mono text-terminal-grey">#{c.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Whitelist Section ─── */}
        {activeSection === 'whitelist' && (
          <div className="space-y-6 animate-fade-in">
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">Whitelist Voters (On-Chain)</h3>
              <div className="protocol-divider mb-4" />
              <form onSubmit={handleWhitelist} className="space-y-4">
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Election</label>
                  <select
                    value={whitelistForm.electionId}
                    onChange={(e) => setWhitelistForm({ ...whitelistForm, electionId: e.target.value })}
                    className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black"
                    required
                  >
                    <option value="">Select election...</option>
                    {elections.filter((e) => e.phase === 'Setup').map((e) => (
                      <option key={e.id} value={e.id}>{e.name} (Setup)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="protocol-label text-[10px] block mb-1">Wallet Addresses (one per line or comma-separated)</label>
                  <textarea
                    value={whitelistForm.addresses}
                    onChange={(e) => setWhitelistForm({ ...whitelistForm, addresses: e.target.value })}
                    placeholder={"0x1234...abcd\n0x5678...efgh\n0x9abc...1234"}
                    rows={6}
                    className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-xs focus:outline-none focus:border-terminal-black resize-none"
                    required
                  />
                  <p className="text-[10px] text-terminal-grey mt-1">
                    {whitelistForm.addresses
                      .split(/[\n,]+/)
                      .filter((a) => a.trim().startsWith('0x') && a.trim().length === 42).length} valid address(es) detected
                  </p>
                </div>
                <button type="submit" disabled={adminLoading} className="btn-protocol-primary px-8 py-3">
                  {adminLoading ? 'Whitelisting...' : 'Whitelist Voters (On-Chain)'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── Management Section ─── */}
        {activeSection === 'management' && isOwner && (
          <div className="space-y-6 animate-fade-in">
            <div className="protocol-card bg-white p-6">
              <h3 className="text-sm font-bold text-terminal-black uppercase tracking-protocol mb-4">Manage Admins (On-Chain)</h3>
              <div className="protocol-divider mb-4" />
              <form className="space-y-4">
                <div>
                  <label className="protocol-label text-[10px] block mb-1">New or Existing Admin MetaMask Address</label>
                  <input
                    type="text"
                    value={adminAddressForm}
                    onChange={(e) => setAdminAddressForm(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-terminal-black/15 font-mono text-sm focus:outline-none focus:border-terminal-black"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={handleAddAdmin} disabled={adminLoading} className="btn-protocol-primary px-8 py-3 flex-1">
                    {adminLoading ? 'Processing...' : 'Add Admin'}
                  </button>
                  <button type="button" onClick={handleRemoveAdmin} disabled={adminLoading} className="px-8 py-3 flex-1 bg-red-600 text-white font-semibold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors">
                    {adminLoading ? 'Processing...' : 'Remove Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
