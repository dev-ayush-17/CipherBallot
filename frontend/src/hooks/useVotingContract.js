import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';

/*
 * useVotingContract — Custom React Hook
 * Interfaces with the Voting.sol smart contract via Ethers.js v6.
 *
 * Requires:
 *   - MetaMask provider available at window.ethereum
 *   - Connected wallet (account address passed as prop)
 *
 * The contract ABI and address are placeholders.
 * Member 1 will provide the actual ABI after compiling Voting.sol with Hardhat.
 * Update CONTRACT_ADDRESS after deployment to Sepolia.
 *
 * Usage:
 *   const {
 *     candidates, electionState, hasVoted, voterTurnout,
 *     castVote, getResults, loading, txStatus, error
 *   } = useVotingContract(account);
 */

// ─── Contract Configuration ───
// TODO: Update after Member 1 deploys contracts to Sepolia
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Placeholder ABI — covers the core Voting.sol interface
// Member 1 will generate the full ABI via `npx hardhat compile`
const CONTRACT_ABI = [
  // Read methods
  'function getCandidates() view returns (tuple(uint256 id, string name, string department, uint256 voteCount, bool isActive)[])',
  'function getElectionState() view returns (uint8)',
  'function hasVoted(address voter) view returns (bool)',
  'function totalVoters() view returns (uint256)',
  'function totalVotesCast() view returns (uint256)',
  'function electionName() view returns (string)',
  'function electionEndTime() view returns (uint256)',

  // Write methods
  'function vote(uint256 candidateId)',

  // Events
  'event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp)',
  'event ElectionStateChanged(uint8 newState)',
];

// Election states mapping
const ELECTION_STATES = {
  0: 'NOT_STARTED',
  1: 'ACTIVE',
  2: 'PAUSED',
  3: 'ENDED',
};

export default function useVotingContract(account) {
  const [candidates, setCandidates] = useState([]);
  const [electionState, setElectionState] = useState(null);
  const [electionName, setElectionName] = useState('');
  const [electionEndTime, setElectionEndTime] = useState(null);
  const [hasVotedStatus, setHasVotedStatus] = useState(false);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | 'pending' | 'confirmed' | 'failed'
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  /* ─── Create contract instance ─── */
  const contract = useMemo(() => {
    if (!account || !window.ethereum) return null;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // We need the signer for write operations
      // For read-only, the provider is sufficient, but we create with signer for convenience
      return {
        provider,
        getReadContract: async () => {
          return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        },
        getWriteContract: async () => {
          const signer = await provider.getSigner();
          return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        },
      };
    } catch (err) {
      console.error('[CipherBallot] Contract initialization error:', err);
      return null;
    }
  }, [account]);

  /* ─── Fetch candidates from contract ─── */
  const fetchCandidates = useCallback(async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const readContract = await contract.getReadContract();
      const rawCandidates = await readContract.getCandidates();

      const parsed = rawCandidates.map((c) => ({
        id: Number(c.id),
        name: c.name,
        department: c.department,
        voteCount: Number(c.voteCount),
        isActive: c.isActive,
      }));

      setCandidates(parsed);
    } catch (err) {
      console.error('[CipherBallot] Failed to fetch candidates:', err);
      setError('Failed to load candidates from the blockchain.');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  /* ─── Get election state ─── */
  const fetchElectionState = useCallback(async () => {
    if (!contract) return;

    try {
      const readContract = await contract.getReadContract();

      const [state, name, endTime, voters, votes] = await Promise.all([
        readContract.getElectionState(),
        readContract.electionName(),
        readContract.electionEndTime(),
        readContract.totalVoters(),
        readContract.totalVotesCast(),
      ]);

      setElectionState(ELECTION_STATES[Number(state)] || 'UNKNOWN');
      setElectionName(name);
      setElectionEndTime(Number(endTime));
      setTotalVoters(Number(voters));
      setTotalVotesCast(Number(votes));
    } catch (err) {
      console.error('[CipherBallot] Failed to fetch election state:', err);
    }
  }, [contract]);

  /* ─── Check if current account has voted ─── */
  const checkHasVoted = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const readContract = await contract.getReadContract();
      const voted = await readContract.hasVoted(account);
      setHasVotedStatus(voted);
    } catch (err) {
      console.error('[CipherBallot] Failed to check vote status:', err);
    }
  }, [contract, account]);

  /* ─── Cast vote — sends on-chain transaction ─── */
  const castVote = useCallback(
    async (candidateId) => {
      if (!contract) {
        setError('Wallet not connected. Please connect MetaMask.');
        return false;
      }

      try {
        setTxStatus('pending');
        setError(null);

        const writeContract = await contract.getWriteContract();
        const tx = await writeContract.vote(candidateId);

        setTxHash(tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          setTxStatus('confirmed');
          setHasVotedStatus(true);
          // Refresh candidates to reflect updated vote counts
          await fetchCandidates();
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
          setError(`Contract error: ${err.reason}`);
        } else {
          setError('Failed to cast vote. Please try again.');
        }

        console.error('[CipherBallot] Vote transaction error:', err);
        return false;
      }
    },
    [contract, fetchCandidates]
  );

  /* ─── Get results (read-only, for Results page) ─── */
  const getResults = useCallback(async () => {
    await Promise.all([fetchCandidates(), fetchElectionState()]);
  }, [fetchCandidates, fetchElectionState]);

  /* ─── Reset transaction status ─── */
  const resetTxStatus = useCallback(() => {
    setTxStatus(null);
    setTxHash(null);
    setError(null);
  }, []);

  /* ─── Auto-fetch data when account changes ─── */
  useEffect(() => {
    if (account && contract) {
      fetchCandidates();
      fetchElectionState();
      checkHasVoted();
    }
  }, [account, contract, fetchCandidates, fetchElectionState, checkHasVoted]);

  return {
    // Data
    candidates,
    electionState,
    electionName,
    electionEndTime,
    hasVoted: hasVotedStatus,
    totalVoters,
    totalVotesCast,
    voterTurnout: totalVoters > 0 ? ((totalVotesCast / totalVoters) * 100).toFixed(1) : '0.0',

    // Actions
    castVote,
    getResults,
    fetchCandidates,
    resetTxStatus,

    // Status
    loading,
    txStatus,
    txHash,
    error,

    // Constants
    ELECTION_STATES,
  };
}
