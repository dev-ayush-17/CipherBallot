// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ElectionManager.sol";

/// @title Voting
/// @notice Core voting contract: candidate registration (with on-chain eligibility
///         checks), one-vote-per-wallet casting, and result tallying for CipherBallot.
/// @dev Reads election phase / whitelist status from an already-deployed
///      ElectionManager. Deploy ElectionManager first, then this contract with its
///      address, then call ElectionManager.setVotingContract(address(this)).
contract Voting {
    ElectionManager public immutable electionManager;

    /// @dev CGPA stored/compared in basis points (CGPA * 100) to avoid decimals on-chain.
    ///      7.5 CGPA -> 750.
    uint256 public constant MIN_CGPA_BPS = 750;

    struct Candidate {
        string name;
        string manifestoURI; // off-chain link (backend/IPFS) to full bio/photo/manifesto
        uint256 cgpaBps; // CGPA * 100, kept on-chain so eligibility is publicly auditable
        bool hasBacklogs;
        uint256 voteCount;
    }

    // electionId => candidateId (1-indexed) => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

    // electionId => voter wallet => hasVoted (this IS the "one vote per wallet" guarantee)
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event CandidateRegistered(uint256 indexed electionId, uint256 indexed candidateId, string name, uint256 cgpaBps);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error CallerNotAdmin();
    error CandidateNotEligible();
    error NotWhitelisted();
    error AlreadyVoted();
    error WrongPhaseForAction();
    error VotingWindowClosed();
    error InvalidCandidate();

    constructor(address _electionManager) {
        electionManager = ElectionManager(_electionManager);
    }

    modifier onlyDuringPhase(uint256 electionId, ElectionManager.Phase expected) {
        if (electionManager.getPhase(electionId) != expected) revert WrongPhaseForAction();
        _;
    }

    // ---------------------------------------------------------------------
    // Candidate management (Academic Criteria Validation)
    // ---------------------------------------------------------------------

    /// @notice Register a candidate on-chain. Only an ElectionManager admin may call this,
    ///         and only while the election is still in Setup phase.
    /// @dev Enforces CGPA >= 7.5 and no active backlogs on-chain -- this is what makes the
    ///      eligibility check auditable on Etherscan rather than a claim the backend makes
    ///      off-chain. The frontend admin dashboard should still pre-validate before calling
    ///      this, so admins get a friendly error instead of a failed transaction.
    function registerCandidate(
        uint256 electionId,
        string calldata name,
        string calldata manifestoURI,
        uint256 cgpaBps,
        bool hasBacklogs
    ) external onlyDuringPhase(electionId, ElectionManager.Phase.Setup) returns (uint256 candidateId) {
        if (!electionManager.admins(msg.sender)) revert CallerNotAdmin();
        if (cgpaBps < MIN_CGPA_BPS || hasBacklogs) revert CandidateNotEligible();

        candidateId = electionManager.incrementCandidateCount(electionId);

        candidates[electionId][candidateId] = Candidate({
            name: name,
            manifestoURI: manifestoURI,
            cgpaBps: cgpaBps,
            hasBacklogs: hasBacklogs,
            voteCount: 0
        });

        emit CandidateRegistered(electionId, candidateId, name, cgpaBps);
    }

    // ---------------------------------------------------------------------
    // Voting (Cast Vote -> MetaMask Signing -> Tx Confirmation -> hasVoted = true)
    // ---------------------------------------------------------------------

    /// @notice Cast one vote for a candidate in an election. Reverts if the caller is not
    ///         whitelisted, has already voted, or the election isn't Active.
    function castVote(uint256 electionId, uint256 candidateId)
        external
        onlyDuringPhase(electionId, ElectionManager.Phase.Active)
    {
        if (!electionManager.isWhitelisted(electionId, msg.sender)) revert NotWhitelisted();
        if (hasVoted[electionId][msg.sender]) revert AlreadyVoted();

        (, uint256 startTime, uint256 endTime, , uint256 candidateCount, ) = electionManager.getElection(electionId);
        if (block.timestamp < startTime || block.timestamp > endTime) revert VotingWindowClosed();
        if (candidateId == 0 || candidateId > candidateCount) revert InvalidCandidate();

        // Effects before any further reads - standard checks-effects-interactions ordering.
        hasVoted[electionId][msg.sender] = true;
        candidates[electionId][candidateId].voteCount++;

        emit VoteCast(electionId, candidateId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Results (Publish Results / Results.jsx)
    // ---------------------------------------------------------------------

    /// @notice Fetch a single candidate's details and live/final vote count.
    function getCandidate(uint256 electionId, uint256 candidateId)
        external
        view
        returns (
            string memory name,
            string memory manifestoURI,
            uint256 cgpaBps,
            uint256 voteCount
        )
    {
        Candidate storage c = candidates[electionId][candidateId];
        return (c.name, c.manifestoURI, c.cgpaBps, c.voteCount);
    }

    /// @notice Fetch full results for an election in one call, for the Results chart.
    /// @return names Candidate names, ordered by candidateId (1..N)
    /// @return voteCounts Matching vote counts, same order as names
    function getResults(uint256 electionId)
        external
        view
        returns (string[] memory names, uint256[] memory voteCounts)
    {
        (, , , , uint256 candidateCount, ) = electionManager.getElection(electionId);

        names = new string[](candidateCount);
        voteCounts = new uint256[](candidateCount);

        for (uint256 i = 1; i <= candidateCount; i++) {
            Candidate storage c = candidates[electionId][i];
            names[i - 1] = c.name;
            voteCounts[i - 1] = c.voteCount;
        }
    }
}
