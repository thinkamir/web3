// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MerkleEntryVerifier.sol";

contract DrawRoundManager is AccessControl, Pausable, ReentrancyGuard, MerkleEntryVerifier {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ROUND_CREATOR_ROLE = keccak256("ROUND_CREATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum RoundStatus {
        Created,
        Open,
        Filled,
        Sealed,
        RandomRequested,
        Finalized,
        Claiming,
        Completed,
        Cancelled
    }

    struct Round {
        address creator;
        uint256 prizeId;
        uint256 targetPoints;
        uint256 pointsPerTicket;
        uint256 totalTickets;
        uint256 ticketPrice;
        uint256 maxPerUser;
        bool freeEntryEnabled;
        RoundStatus status;
        bytes32 merkleRoot;
        uint256 randomness;
        uint256 winningTicket;
        uint256 createdAt;
        uint256 startTime;
        uint256 endTime;
    }

    mapping(uint256 => Round) public rounds;
    uint256 public roundCount;

    mapping(uint256 => mapping(address => uint256)) public userTickets;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event RoundCreated(
        uint256 indexed roundId,
        address indexed creator,
        uint256 prizeId,
        uint256 targetPoints
    );
    event RoundOpened(uint256 indexed roundId);
    event BatchCommitted(uint256 indexed roundId, uint256 ticketCount);
    event RoundSealed(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalTickets);
    event RandomnessRequested(uint256 indexed roundId, bytes32 requestId);
    event RoundFinalized(uint256 indexed roundId, uint256 randomness, uint256 winningTicket);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 winningTicket);
    event RoundCancelled(uint256 indexed roundId);

    constructor(address prizeVault) MerkleEntryVerifier(prizeVault) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function createRound(
        uint256 prizeId,
        uint256 targetPoints,
        uint256 pointsPerTicket,
        uint256 maxPerUser,
        bool freeEntryEnabled,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ROUND_CREATOR_ROLE) whenNotPaused returns (uint256) {
        require(targetPoints > 0, "Target points must be greater than 0");
        require(pointsPerTicket > 0, "Points per ticket must be greater than 0");
        require(startTime < endTime, "Invalid time range");
        require(endTime > block.timestamp, "End time must be in the future");

        uint256 roundId = roundCount++;
        rounds[roundId] = Round({
            creator: msg.sender,
            prizeId: prizeId,
            targetPoints: targetPoints,
            pointsPerTicket: pointsPerTicket,
            totalTickets: 0,
            ticketPrice: 1,
            maxPerUser: maxPerUser,
            freeEntryEnabled: freeEntryEnabled,
            status: RoundStatus.Created,
            merkleRoot: bytes32(0),
            randomness: 0,
            winningTicket: 0,
            createdAt: block.timestamp,
            startTime: startTime,
            endTime: endTime
        });

        emit RoundCreated(roundId, msg.sender, prizeId, targetPoints);
        return roundId;
    }

    function openRound(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Created, "Invalid round status");
        rounds[roundId].status = RoundStatus.Open;
        emit RoundOpened(roundId);
    }

    function commitBatch(
        uint256 roundId,
        address[] calldata users,
        uint256[] calldata startTickets,
        uint256[] calldata endTickets
    ) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Open, "Round not open");
        require(users.length == startTickets.length && users.length == endTickets.length, "Length mismatch");

        uint256 batchCount = 0;
        for (uint256 i = 0; i < users.length; i++) {
            if (!hasParticipated[roundId][users[i]]) {
                hasParticipated[roundId][users[i]] = true;
                userTickets[roundId][users[i]] = startTickets[i];
                batchCount += (endTickets[i] - startTickets[i] + 1);
            }
        }

        rounds[roundId].totalTickets += batchCount;
        emit BatchCommitted(roundId, batchCount);

        if (rounds[roundId].totalTickets >= rounds[roundId].targetPoints) {
            rounds[roundId].status = RoundStatus.Filled;
        }
    }

    function sealRound(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(
            rounds[roundId].status == RoundStatus.Open || rounds[roundId].status == RoundStatus.Filled,
            "Cannot seal round"
        );
        require(rounds[roundId].totalTickets > 0, "No tickets sold");

        bytes32 merkleRoot = generateMerkleRoot(roundId);
        rounds[roundId].merkleRoot = merkleRoot;
        rounds[roundId].status = RoundStatus.Sealed;

        emit RoundSealed(roundId, merkleRoot, rounds[roundId].totalTickets);
    }

    function requestRandomness(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Sealed, "Round not sealed");
        rounds[roundId].status = RoundStatus.RandomRequested;
        bytes32 requestId = keccak256(abi.encodePacked(roundId, block.timestamp, block.prevrandao));
        emit RandomnessRequested(roundId, requestId);
    }

    function fulfillRandomWords(uint256 roundId, uint256 randomness) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.RandomRequested, "Randomness not requested");

        rounds[roundId].randomness = randomness;
        rounds[roundId].winningTicket = (randomness % rounds[roundId].totalTickets) + 1;
        rounds[roundId].status = RoundStatus.Finalized;

        emit RoundFinalized(roundId, randomness, rounds[roundId].winningTicket);
    }

    function claimPrize(uint256 roundId, bytes32[] calldata proof) external nonReentrant {
        require(rounds[roundId].status == RoundStatus.Finalized, "Round not finalized");
        require(!hasClaimed[roundId][msg.sender], "Already claimed");

        uint256 userStartTicket = userTickets[roundId][msg.sender];
        uint256 userEndTicket = userStartTicket + rounds[roundId].maxPerUser - 1;

        require(
            verifyWinningEntry(roundId, msg.sender, userStartTicket, userEndTicket, proof),
            "Not a winner or invalid proof"
        );

        require(
            rounds[roundId].winningTicket >= userStartTicket && rounds[roundId].winningTicket <= userEndTicket,
            "Winning ticket not in user range"
        );

        hasClaimed[roundId][msg.sender] = true;
        emit PrizeClaimed(roundId, msg.sender, rounds[roundId].winningTicket);
    }

    function cancelRound(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(
            rounds[roundId].status != RoundStatus.Completed &&
            rounds[roundId].status != RoundStatus.Cancelled,
            "Cannot cancel"
        );
        rounds[roundId].status = RoundStatus.Cancelled;
        emit RoundCancelled(roundId);
    }

    function getRoundInfo(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    function getUserTickets(uint256 roundId, address user) external view returns (uint256) {
        return userTickets[roundId][user];
    }

    function hasUserClaimed(uint256 roundId, address user) external view returns (bool) {
        return hasClaimed[roundId][user];
    }
}
