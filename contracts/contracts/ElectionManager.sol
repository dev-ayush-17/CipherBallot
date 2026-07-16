// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ElectionManager
/// @notice Manages election lifecycle (Setup -> Active -> Ended), admin access control,
///         and on-chain voter whitelisting for CipherBallot campus elections.
/// @dev Deployed first. The Voting contract's address is linked in afterwards via
///      setVotingContract(), since Voting.sol needs this contract's address at its
///      own construction time (see contracts/scripts/deploy.js for ordering).
contract ElectionManager {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum Phase {
        Setup, // Admin creates election, registers candidates, whitelists voters
        Active, // Voting is open
        Ended // Voting closed, results final
    }

    struct Election {
        string name; // e.g. "Student Council Election 2026"
        uint256 startTime; // unix timestamp voting opens
        uint256 endTime; // unix timestamp voting closes
        Phase phase;
        uint256 candidateCount;
        address creator;
    }

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    address public owner;
    mapping(address => bool) public admins; // Election Committee members

    address public votingContract; // set post-deployment, see setVotingContract()

    uint256 public electionCount;
    mapping(uint256 => Election) public elections;

    // electionId => student wallet => whitelisted
    mapping(uint256 => mapping(address => bool)) public whitelist;

    // ---------------------------------------------------------------------
    // Events (source of truth for the public Sepolia Etherscan audit trail)
    // ---------------------------------------------------------------------

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event VotingContractSet(address indexed votingContract);
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event VotersWhitelisted(uint256 indexed electionId, uint256 count);
    event VoterRemovedFromWhitelist(uint256 indexed electionId, address indexed voter);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error NotOwner();
    error NotAdmin();
    error NotVotingContract();
    error ElectionNotFound();
    error InvalidTimeWindow();
    error WrongPhase(Phase expected, Phase actual);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert NotAdmin();
        _;
    }

    modifier onlyVotingContract() {
        if (msg.sender != votingContract) revert NotVotingContract();
        _;
    }

    modifier electionExists(uint256 electionId) {
        if (electionId == 0 || electionId > electionCount) revert ElectionNotFound();
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // ---------------------------------------------------------------------
    // Admin management
    // ---------------------------------------------------------------------

    /// @notice Add another Election Committee member as admin.
    function addAdmin(address account) external onlyOwner {
        admins[account] = true;
        emit AdminAdded(account);
    }

    function removeAdmin(address account) external onlyOwner {
        admins[account] = false;
        emit AdminRemoved(account);
    }

    /// @notice Link the deployed Voting contract so it can push candidateCount updates.
    /// @dev Must be called once, right after Voting.sol is deployed.
    function setVotingContract(address _votingContract) external onlyOwner {
        votingContract = _votingContract;
        emit VotingContractSet(_votingContract);
    }

    // ---------------------------------------------------------------------
    // Election lifecycle
    // ---------------------------------------------------------------------

    /// @notice Create a new campus election (Student Council, CR, hostel warden, club coordinator, etc).
    function createElection(
        string calldata name,
        uint256 startTime,
        uint256 endTime
    ) external onlyAdmin returns (uint256 electionId) {
        if (endTime <= startTime) revert InvalidTimeWindow();

        electionCount++;
        electionId = electionCount;

        elections[electionId] = Election({
            name: name,
            startTime: startTime,
            endTime: endTime,
            phase: Phase.Setup,
            candidateCount: 0,
            creator: msg.sender
        });

        emit ElectionCreated(electionId, name, startTime, endTime);
    }

    /// @notice Move an election from Setup -> Active. Candidates/whitelist should be finalized first.
    function startElection(uint256 electionId) external onlyAdmin electionExists(electionId) {
        Election storage election = elections[electionId];
        if (election.phase != Phase.Setup) revert WrongPhase(Phase.Setup, election.phase);
        election.phase = Phase.Active;
        emit ElectionStarted(electionId);
    }

    /// @notice Move an election from Active -> Ended. Locks voting; results become final.
    function endElection(uint256 electionId) external onlyAdmin electionExists(electionId) {
        Election storage election = elections[electionId];
        if (election.phase != Phase.Active) revert WrongPhase(Phase.Active, election.phase);
        election.phase = Phase.Ended;
        emit ElectionEnded(electionId);
    }

    // ---------------------------------------------------------------------
    // Whitelisting (Student Wallet Linkage -> On-Chain Whitelisting)
    // ---------------------------------------------------------------------

    /// @notice Batch-whitelist student wallet addresses for an election.
    /// @dev Backend maps roll numbers -> wallet addresses off-chain (MongoDB); admin
    ///      uploads the resulting address list here, in batches, before Start Election.
    function whitelistVoters(uint256 electionId, address[] calldata voters)
        external
        onlyAdmin
        electionExists(electionId)
    {
        Election storage election = elections[electionId];
        if (election.phase != Phase.Setup) revert WrongPhase(Phase.Setup, election.phase);

        for (uint256 i = 0; i < voters.length; i++) {
            whitelist[electionId][voters[i]] = true;
        }
        emit VotersWhitelisted(electionId, voters.length);
    }

    /// @notice Revoke a single voter's whitelist status (e.g. found to be ineligible/duplicate).
    function removeVoterFromWhitelist(uint256 electionId, address voter)
        external
        onlyAdmin
        electionExists(electionId)
    {
        whitelist[electionId][voter] = false;
        emit VoterRemovedFromWhitelist(electionId, voter);
    }

    function isWhitelisted(uint256 electionId, address voter) external view returns (bool) {
        return whitelist[electionId][voter];
    }

    // ---------------------------------------------------------------------
    // Views consumed by Voting.sol / the frontend dashboards
    // ---------------------------------------------------------------------

    function getPhase(uint256 electionId) external view electionExists(electionId) returns (Phase) {
        return elections[electionId].phase;
    }

    function getElection(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (
            string memory name,
            uint256 startTime,
            uint256 endTime,
            Phase phase,
            uint256 candidateCount,
            address creator
        )
    {
        Election storage e = elections[electionId];
        return (e.name, e.startTime, e.endTime, e.phase, e.candidateCount, e.creator);
    }

    /// @dev Called only by the Voting contract when a new candidate is registered.
    function incrementCandidateCount(uint256 electionId)
        external
        onlyVotingContract
        electionExists(electionId)
        returns (uint256 newCandidateId)
    {
        elections[electionId].candidateCount++;
        return elections[electionId].candidateCount;
    }
}
