import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  ELECTION_MANAGER_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
  ELECTION_MANAGER_ABI,
  VOTING_ABI,
  SEPOLIA_RPC_URL,
} from '../utils/contracts';

/**
 * useAdminContract — Custom React Hook for admin on-chain operations.
 * Wraps ElectionManager + Voting write methods that require admin privileges.
 *
 * @param {string|null} account - Connected wallet address
 */
export default function useAdminContract(account) {
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const contracts = useMemo(() => {
    if (!window.ethereum || !account) return null;

    try {
      const readProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      return {
        getElectionManager: async () => {
          const writeProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await writeProvider.getSigner();
          return new ethers.Contract(ELECTION_MANAGER_ADDRESS, ELECTION_MANAGER_ABI, signer);
        },
        getVoting: async () => {
          const writeProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await writeProvider.getSigner();
          return new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, signer);
        },
        getElectionManagerRead: async () => {
          return new ethers.Contract(ELECTION_MANAGER_ADDRESS, ELECTION_MANAGER_ABI, readProvider);
        },
      };
    } catch (err) {
      console.error('[CipherBallot Admin] Contract init error:', err);
      return null;
    }
  }, [account]);

  const resetTx = useCallback(() => {
    setTxStatus(null);
    setTxHash(null);
    setError(null);
  }, []);

  // ─── Check if account is admin ────────────────────────────────────────
  const checkIsAdmin = useCallback(async () => {
    if (!contracts || !account) return false;
    try {
      const em = await contracts.getElectionManagerRead();
      console.log("[DEBUG] Checking admin status for:", account, "on contract:", await em.getAddress());
      const result = await em.admins(account);
      console.log("[DEBUG] Admin result from contract:", result);
      return result;
    } catch (err) {
      console.error("[DEBUG] checkIsAdmin failed with error:", err);
      return false;
    }
  }, [contracts, account]);

  // ─── Check if account is owner ────────────────────────────────────────
  const checkIsOwner = useCallback(async () => {
    if (!contracts || !account) return false;
    try {
      const em = await contracts.getElectionManagerRead();
      const owner = await em.owner();
      return owner.toLowerCase() === account.toLowerCase();
    } catch {
      return false;
    }
  }, [contracts, account]);

  // ─── Create Election ──────────────────────────────────────────────────
  const createElection = useCallback(
    async (name, startTime, endTime) => {
      if (!contracts || !account) return null;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const emRead = await contracts.getElectionManagerRead();
        
        // Build transaction data using the working read provider
        const txData = await emRead.createElection.populateTransaction(name, startTime, endTime);
        
        // Estimate gas using the working read provider
        const gasLimit = await emRead.createElection.estimateGas(name, startTime, endTime, { from: account });
        
        // Bypass BrowserProvider entirely and send the raw request to MetaMask
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: account,
            to: ELECTION_MANAGER_ADDRESS,
            data: txData.data,
            gas: '0x' + gasLimit.toString(16)
          }]
        });
        
        setTxHash(txHash);
        
        // Wait for confirmation using the working read provider
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const receipt = await provider.waitForTransaction(txHash);

        if (receipt.status === 1) {
          setTxStatus('confirmed');
          // Parse the ElectionCreated event to get the electionId
          const log = receipt.logs.find((l) => {
            try {
              const parsed = emRead.interface.parseLog(l);
              return parsed?.name === 'ElectionCreated';
            } catch {
              return false;
            }
          });
          if (log) {
            const parsed = emRead.interface.parseLog(log);
            return Number(parsed.args.electionId);
          }
          return true;
        }
        setTxStatus('failed');
        return null;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || err.message || 'Failed to create election');
        console.error('[CipherBallot Admin] createElection error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [contracts, account]
  );

  // ─── Start Election ───────────────────────────────────────────────────
  const startElection = useCallback(
    async (electionId) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const em = await contracts.getElectionManager();
        const tx = await em.startElection(electionId);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || 'Failed to start election');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  // ─── End Election ─────────────────────────────────────────────────────
  const endElection = useCallback(
    async (electionId) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const em = await contracts.getElectionManager();
        const tx = await em.endElection(electionId);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || 'Failed to end election');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  // ─── Register Candidate ───────────────────────────────────────────────
  const registerCandidate = useCallback(
    async (electionId, name, manifestoURI, cgpa, hasBacklogs) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const cgpaBps = Math.round(cgpa * 100); // 7.5 → 750
        const voting = await contracts.getVoting();
        const tx = await voting.registerCandidate(electionId, name, manifestoURI, cgpaBps, hasBacklogs);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        const errorMap = {
          CallerNotAdmin: 'You are not an admin.',
          CandidateNotEligible: 'Candidate does not meet eligibility criteria (CGPA ≥ 7.5, no backlogs).',
          WrongPhaseForAction: 'Election must be in Setup phase to register candidates.',
        };
        setError(errorMap[err.reason] || err.reason || 'Failed to register candidate');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  // ─── Whitelist Voters ─────────────────────────────────────────────────
  const whitelistVoters = useCallback(
    async (electionId, addresses) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const em = await contracts.getElectionManager();
        const tx = await em.whitelistVoters(electionId, addresses);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || 'Failed to whitelist voters');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  // ─── Add Admin ────────────────────────────────────────────────────────
  const addAdmin = useCallback(
    async (adminAddress) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const em = await contracts.getElectionManager();
        const tx = await em.addAdmin(adminAddress);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || 'Failed to add admin');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  // ─── Remove Admin ─────────────────────────────────────────────────────
  const removeAdmin = useCallback(
    async (adminAddress) => {
      if (!contracts) return false;
      try {
        setLoading(true);
        setTxStatus('pending');
        setError(null);

        const em = await contracts.getElectionManager();
        const tx = await em.removeAdmin(adminAddress);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        setTxStatus(receipt.status === 1 ? 'confirmed' : 'failed');
        return receipt.status === 1;
      } catch (err) {
        setTxStatus('failed');
        setError(err.reason || 'Failed to remove admin');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [contracts]
  );

  return {
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
    loading,
    txStatus,
    txHash,
    error,
  };
}
