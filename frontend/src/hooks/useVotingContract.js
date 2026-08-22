import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  ELECTION_MANAGER_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
  ELECTION_MANAGER_ABI,
  VOTING_ABI,
  PHASES,
} from '../utils/contracts';

/**
 * useVotingContract — Custom React Hook
 * Interfaces with the deployed ElectionManager + Voting contracts on Sepolia.
 *
 * The system is election-based: every read/write requires an electionId.
 * This hook auto-fetches the latest election and its candidates/state.
 *
 * @param {string|null} account - Connected wallet address
 * @param {number|null} electionIdOverride - Specific election to load (defaults to latest)
 */
export default function useVotingContract(account, electionIdOverride = null) {
  // ─── State ──────────────────────────────────────────────────────────────
  const [elections, setElections] = useState([]);
  const [currentElectionId, setCurrentElectionId] = useState(electionIdOverride);
  const [currentElection, setCurrentElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionPhase, setElectionPhase] = useState(null);
  const [hasVotedStatus, setHasVotedStatus] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | 'pending' | 'confirmed' | 'failed'
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // ─── Contract instances ─────────────────────────────────────────────────
  const contracts = useMemo(() => {
    if (!window.ethereum) return null;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return {
        provider,
        getElectionManager: async (needsSigner = false) => {
          if (needsSigner) {
            const signer = await provider.getSigner();
            return new ethers.Contract(ELECTION_MANAGER_ADDRESS, ELECTION_MANAGER_ABI, signer);
          }
          return new ethers.Contract(ELECTION_MANAGER_ADDRESS, ELECTION_MANAGER_ABI, provider);
        },
        getVoting: async (needsSigner = false) => {
          if (needsSigner) {
            const signer = await provider.getSigner();
            return new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, signer);
          }
          return new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider);
        },
      };
    } catch (err) {
      console.error('[CipherBallot] Contract init error:', err);
      return null;
    }
  }, []);

  // ─── Fetch all elections ────────────────────────────────────────────────
  const fetchElections = useCallback(async () => {
    if (!contracts) return;

    try {
      const em = await contracts.getElectionManager();
      const count = Number(await em.electionCount());

      if (count === 0) {
        setElections([]);
        return;
      }

      const electionList = [];
      for (let i = 1; i <= count; i++) {
        const [name, startTime, endTime, phase, candidateCount, creator] = await em.getElection(i);
        electionList.push({
          id: i,
          name,
          startTime: Number(startTime),
          endTime: Number(endTime),
          phase: PHASES[Number(phase)] || 'Unknown',
          phaseNum: Number(phase),
          candidateCount: Number(candidateCount),
          creator,
        });
      }

      setElections(electionList);

      // Auto-select latest election if none specified
      if (!electionIdOverride && electionList.length > 0) {
        // Prefer the latest active election, otherwise the latest one
        const active = electionList.find((e) => e.phase === 'Active');
        setCurrentElectionId(active ? active.id : electionList[electionList.length - 1].id);
      }
    } catch (err) {
      console.error('[CipherBallot] Failed to fetch elections:', err);
    }
  }, [contracts, electionIdOverride]);

  // ─── Fetch election details + candidates ────────────────────────────────
  const fetchElectionData = useCallback(async () => {
    if (!contracts || !currentElectionId) return;

    try {
      setLoading(true);
      setError(null);

      const em = await contracts.getElectionManager();
      const voting = await contracts.getVoting();

      // Get election info
      const [name, startTime, endTime, phase, candidateCount, creator] = await em.getElection(currentElectionId);
      const electionInfo = {
        id: currentElectionId,
        name,
        startTime: Number(startTime),
        endTime: Number(endTime),
        phase: PHASES[Number(phase)] || 'Unknown',
        phaseNum: Number(phase),
        candidateCount: Number(candidateCount),
        creator,
      };
      setCurrentElection(electionInfo);
      setElectionPhase(electionInfo.phase);

      // Get candidates
      const candidateList = [];
      for (let i = 1; i <= electionInfo.candidateCount; i++) {
        try {
          const [cName, manifestoURI, cgpaBps, voteCount] = await voting.getCandidate(currentElectionId, i);
          candidateList.push({
            id: i,
            name: cName,
            manifestoURI,
            cgpa: (Number(cgpaBps) / 100).toFixed(2),
            cgpaBps: Number(cgpaBps),
            voteCount: Number(voteCount),
            isActive: true,
          });
        } catch (err) {
          console.error(`[CipherBallot] Failed to fetch candidate ${i}:`, err);
        }
      }
      setCandidates(candidateList);

      // Check if current user has voted & is whitelisted
      if (account) {
        try {
          const voted = await voting.hasVoted(currentElectionId, account);
          setHasVotedStatus(voted);
        } catch {
          setHasVotedStatus(false);
        }

        try {
          const whitelisted = await em.isWhitelisted(currentElectionId, account);
          setIsWhitelisted(whitelisted);
        } catch {
          setIsWhitelisted(false);
        }
      }
    } catch (err) {
      console.error('[CipherBallot] Failed to fetch election data:', err);
      setError('Failed to load election data from the blockchain.');
    } finally {
      setLoading(false);
    }
  }, [contracts, currentElectionId, account]);

  // ─── Cast vote ──────────────────────────────────────────────────────────
  const castVote = useCallback(
    async (candidateId) => {
      if (!contracts || !currentElectionId) {
        setError('No election selected or wallet not connected.');
        return false;
      }

      try {
        setTxStatus('pending');
        setError(null);

        const voting = await contracts.getVoting(true);
        const tx = await voting.castVote(currentElectionId, candidateId);
        setTxHash(tx.hash);

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          setTxStatus('confirmed');
          setHasVotedStatus(true);
          // Refresh candidates to show updated vote counts
          await fetchElectionData();
          return true;
        } else {
          setTxStatus('failed');
          setError('Transaction failed on-chain.');
          return false;
        }
      } catch (err) {
        setTxStatus('failed');

        if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
          setError('Transaction rejected by user.');
        } else if (err.reason) {
          // Map custom errors to friendly messages
          const errorMap = {
            NotWhitelisted: 'You are not whitelisted for this election.',
            AlreadyVoted: 'You have already voted in this election.',
            WrongPhaseForAction: 'Voting is not currently active for this election.',
            VotingWindowClosed: 'The voting window has closed.',
            InvalidCandidate: 'Invalid candidate selected.',
          };
          setError(errorMap[err.reason] || `Contract error: ${err.reason}`);
        } else {
          setError('Failed to cast vote. Please try again.');
        }

        console.error('[CipherBallot] Vote error:', err);
        return false;
      }
    },
    [contracts, currentElectionId, fetchElectionData]
  );

  // ─── Get results (convenience wrapper) ──────────────────────────────────
  const getResults = useCallback(async () => {
    if (!contracts || !currentElectionId) return { names: [], voteCounts: [] };

    try {
      const voting = await contracts.getVoting();
      const [names, voteCounts] = await voting.getResults(currentElectionId);
      return {
        names: names.map((n) => n),
        voteCounts: voteCounts.map((v) => Number(v)),
      };
    } catch (err) {
      console.error('[CipherBallot] Failed to get results:', err);
      return { names: [], voteCounts: [] };
    }
  }, [contracts, currentElectionId]);

  // ─── Reset transaction status ───────────────────────────────────────────
  const resetTxStatus = useCallback(() => {
    setTxStatus(null);
    setTxHash(null);
    setError(null);
  }, []);

  // ─── Select a different election ────────────────────────────────────────
  const selectElection = useCallback((id) => {
    setCurrentElectionId(id);
  }, []);

  // ─── Auto-fetch on mount / account change ───────────────────────────────
  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  useEffect(() => {
    if (currentElectionId) {
      fetchElectionData();
    }
  }, [currentElectionId, fetchElectionData]);

  return {
    // Elections
    elections,
    currentElection,
    currentElectionId,
    selectElection,

    // Candidates
    candidates,

    // Election state
    electionPhase,
    electionName: currentElection?.name || '',
    electionStartTime: currentElection?.startTime || null,
    electionEndTime: currentElection?.endTime || null,

    // Voter state
    hasVoted: hasVotedStatus,
    isWhitelisted,

    // Actions
    castVote,
    getResults,
    resetTxStatus,
    refreshData: fetchElectionData,

    // Status
    loading,
    txStatus,
    txHash,
    error,

    // Constants
    PHASES,
  };
}
