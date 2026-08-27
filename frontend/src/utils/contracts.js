/**
 * CipherBallot — Contract Configuration
 * Deployed contract addresses and ABIs for Sepolia testnet.
 * Generated from compiled Hardhat artifacts.
 */

// ─── Deployed Addresses (Sepolia) ───────────────────────────────────────────
export const ELECTION_MANAGER_ADDRESS =
  import.meta.env.VITE_ELECTION_MANAGER_ADDRESS ||
  '0x41f46B902383e664FE01febB9E090fbAd3462c19';

export const VOTING_CONTRACT_ADDRESS =
  import.meta.env.VITE_VOTING_CONTRACT_ADDRESS ||
  '0x6905C747792801fd92B41637BacB8d1798A2f54C';

// ─── ElectionManager ABI ────────────────────────────────────────────────────
export const ELECTION_MANAGER_ABI = [
  // Read
  'function owner() view returns (address)',
  'function admins(address) view returns (bool)',
  'function votingContract() view returns (address)',
  'function electionCount() view returns (uint256)',
  'function elections(uint256) view returns (string name, uint256 startTime, uint256 endTime, uint8 phase, uint256 candidateCount, address creator)',
  'function getElection(uint256 electionId) view returns (string name, uint256 startTime, uint256 endTime, uint8 phase, uint256 candidateCount, address creator)',
  'function getPhase(uint256 electionId) view returns (uint8)',
  'function isWhitelisted(uint256 electionId, address voter) view returns (bool)',
  'function whitelist(uint256, address) view returns (bool)',

  // Write
  'function addAdmin(address account)',
  'function removeAdmin(address account)',
  'function setVotingContract(address _votingContract)',
  'function createElection(string name, uint256 startTime, uint256 endTime) returns (uint256 electionId)',
  'function startElection(uint256 electionId)',
  'function endElection(uint256 electionId)',
  'function whitelistVoters(uint256 electionId, address[] voters)',
  'function removeVoterFromWhitelist(uint256 electionId, address voter)',

  // Events
  'event AdminAdded(address indexed admin)',
  'event AdminRemoved(address indexed admin)',
  'event VotingContractSet(address indexed votingContract)',
  'event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime)',
  'event ElectionStarted(uint256 indexed electionId)',
  'event ElectionEnded(uint256 indexed electionId)',
  'event VotersWhitelisted(uint256 indexed electionId, uint256 count)',
  'event VoterRemovedFromWhitelist(uint256 indexed electionId, address indexed voter)',
];

// ─── Voting ABI ─────────────────────────────────────────────────────────────
export const VOTING_ABI = [
  // Read
  'function electionManager() view returns (address)',
  'function MIN_CGPA_BPS() view returns (uint256)',
  'function candidates(uint256, uint256) view returns (string name, string manifestoURI, uint256 cgpaBps, bool hasBacklogs, uint256 voteCount)',
  'function hasVoted(uint256, address) view returns (bool)',
  'function getCandidate(uint256 electionId, uint256 candidateId) view returns (string name, string manifestoURI, uint256 cgpaBps, uint256 voteCount)',
  'function getResults(uint256 electionId) view returns (string[] names, uint256[] voteCounts)',

  // Write
  'function registerCandidate(uint256 electionId, string name, string manifestoURI, uint256 cgpaBps, bool hasBacklogs) returns (uint256 candidateId)',
  'function castVote(uint256 electionId, uint256 candidateId)',

  // Events
  'event CandidateRegistered(uint256 indexed electionId, uint256 indexed candidateId, string name, uint256 cgpaBps)',
  'event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter)',
];

// ─── Phase Enum (matches ElectionManager.Phase) ─────────────────────────────
export const PHASES = {
  0: 'Setup',
  1: 'Active',
  2: 'Ended',
};

export const PHASE_COLORS = {
  Setup: 'text-amber-600 bg-amber-50 border-amber-200',
  Active: 'text-green-600 bg-green-50 border-green-200',
  Ended: 'text-gray-600 bg-gray-100 border-gray-300',
};

// ─── Network Config ─────────────────────────────────────────────────────────
export const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
export const SEPOLIA_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
