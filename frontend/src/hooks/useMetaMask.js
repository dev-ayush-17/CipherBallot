import { useState, useEffect, useCallback } from 'react';

/*
 * useMetaMask — Custom React Hook
 * Manages MetaMask wallet connection lifecycle:
 *   - Detects window.ethereum provider
 *   - Connects / disconnects wallet
 *   - Listens for account and chain changes
 *   - Auto-reconnects on page reload if previously connected
 *
 * Usage:
 *   const { account, chainId, isConnected, isConnecting, error, connectWallet, disconnectWallet } = useMetaMask();
 */

const SUPPORTED_CHAIN_ID = '0x7a69'; // Hardhat local network (31337 in hex)
const SUPPORTED_CHAIN_NAME = 'Hardhat';

export default function useMetaMask() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /* ─── Check if MetaMask is available ─── */
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  /* ─── Handle account changes ─── */
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAccount(null);
      setIsConnected(false);
      localStorage.removeItem('cipherballot_wallet_connected');
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  }, []);

  /* ─── Handle chain/network changes ─── */
  const handleChainChanged = useCallback((newChainId) => {
    setChainId(newChainId);
    // Warn if not on supported chain
    if (newChainId !== SUPPORTED_CHAIN_ID) {
      setError(`Please switch to ${SUPPORTED_CHAIN_NAME} network.`);
    } else {
      setError(null);
    }
  }, []);

  /* ─── Connect wallet ─── */
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get current chain ID
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      setAccount(accounts[0]);
      setChainId(currentChainId);
      setIsConnected(true);
      localStorage.setItem('cipherballot_wallet_connected', 'true');

      // Switch to supported chain if needed
      if (currentChainId !== SUPPORTED_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SUPPORTED_CHAIN_ID }],
          });
          setChainId(SUPPORTED_CHAIN_ID);
          setError(null);
        } catch (switchError) {
          // Chain not added to MetaMask — prompt to add
          if (switchError.code === 4902) {
            setError(`Please add ${SUPPORTED_CHAIN_NAME} network to MetaMask.`);
          } else {
            setError(`Please switch to ${SUPPORTED_CHAIN_NAME} network.`);
          }
        }
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection request rejected by user.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      console.error('[CipherBallot] MetaMask connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /* ─── Disconnect wallet ─── */
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('cipherballot_wallet_connected');
  }, []);

  /* ─── Setup event listeners & auto-reconnect ─── */
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const ethereum = window.ethereum;

    // Register event listeners
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Auto-reconnect if previously connected
    const wasConnected = localStorage.getItem('cipherballot_wallet_connected');
    if (wasConnected === 'true') {
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            return ethereum.request({ method: 'eth_chainId' });
          }
        })
        .then((currentChainId) => {
          if (currentChainId) {
            setChainId(currentChainId);
            if (currentChainId !== SUPPORTED_CHAIN_ID) {
              setError(`Please switch to ${SUPPORTED_CHAIN_NAME} network.`);
            }
          }
        })
        .catch(console.error);
    }

    // Cleanup listeners on unmount
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  return {
    account,
    chainId,
    isConnected,
    isConnecting,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    error,
    connectWallet,
    disconnectWallet,
    supportedChainId: SUPPORTED_CHAIN_ID,
    supportedChainName: SUPPORTED_CHAIN_NAME,
  };
}
