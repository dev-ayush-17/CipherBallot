import axios from 'axios';

/*
 * CipherBallot — Axios API Client
 * Configured for backend REST API communication (Member 2's Express server).
 * Base URL is read from environment variable VITE_API_URL.
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─── Request Interceptor: Attach auth token if available ─── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cipherballot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── Response Interceptor: Handle common error patterns ─── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expired or invalid — clear local state
          localStorage.removeItem('cipherballot_token');
          break;
        case 403:
          console.error('[CipherBallot] Access forbidden:', error.response.data);
          break;
        case 500:
          console.error('[CipherBallot] Server error:', error.response.data);
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

/* ─── Authentication ─── */

/**
 * SSO Login — sends institutional credentials to backend for verification.
 * @param {string} email - Student institutional email
 * @param {string} password - Student password
 * @returns {Promise<Object>} - { token, student } on success
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.data?.token) {
    localStorage.setItem('cipherballot_token', response.data.data.token);
  }
  return response.data.data;
};

/**
 * Logout — clears authentication state.
 */
export const logout = () => {
  localStorage.removeItem('cipherballot_token');
};

/* ─── Voter Data ─── */

/**
 * Get the authenticated voter's profile (roll number, department, CGPA, photo).
 * @returns {Promise<Object>} - Voter profile data
 */
export const getVoterProfile = async () => {
  const response = await api.get('/voters/profile');
  return response.data;
};

/**
 * Get off-chain candidate metadata (bio, photo, manifesto) from the backend.
 * On-chain candidate data (ID, vote count) is fetched via useVotingContract.
 * @returns {Promise<Array>} - Array of candidate metadata objects
 */
export const getCandidatesMetadata = async () => {
  const response = await api.get('/voters/candidates');
  return response.data;
};

/**
 * Verify if the current student is whitelisted to vote.
 * @param {string} walletAddress - Student's MetaMask wallet address
 * @returns {Promise<Object>} - { isWhitelisted, rollNumber }
 */
export const verifyVoterEligibility = async (walletAddress) => {
  const response = await api.post('/voters/verify', { walletAddress });
  return response.data;
};

export default api;
