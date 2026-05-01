// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MerkleEntryVerifier.sol";

interface IVRFCoordinator {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

contract DrawRoundManagerVRF is AccessControl, Pausable, ReentrancyGuard, MerkleEntryVerifier {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ROUND_CREATOR_ROLE = keccak256("ROUND_CREATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IVRFCoordinator public vrfCoordinator;
    bytes32 public vrfKeyHash;
    uint64 public vrfSubId;

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
        uint256 maxPerUser;
        bool freeEntryEnabled;
        RoundStatus status;
        bytes32 merkleRoot;
        uint256 randomness;
        uint256 winningTicket;
        uint256 requestId;
        uint256 createdAt;
        uint256 startTime;
        uint256 endTime;
    }

    mapping(uint256 => Round) public rounds;
    uint256 public roundCount;

    mapping(uint256 => mapping(address => uint256)) public userTickets;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event RoundCreated(uint256 indexed roundId, address indexed creator, uint256 prizeId);
    event RoundOpened(uint256 indexed roundId);
    event RoundSealed(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalTickets);
    event RandomnessRequested(uint256 indexed roundId, uint256 requestId);
    event RoundFinalized(uint256 indexed roundId, uint256 randomness, uint256 winningTicket);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner);
    event RoundCancelled(uint256 indexed roundId);

    constructor(address _prizeVault) MerkleEntryVerifier(_prizeVault) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function setVRFConfig(address _vrfCoordinator, bytes32 _vrfKeyHash, uint64 _vrfSubId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        vrfCoordinator = IVRFCoordinator(_vrfCoordinator);
        vrfKeyHash = _vrfKeyHash;
        vrfSubId = _vrfSubId;
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

        uint256 roundId = roundCount++;
        rounds[roundId] = Round({
            creator: msg.sender,
            prizeId: prizeId,
            targetPoints: targetPoints,
            pointsPerTicket: pointsPerTicket,
            totalTickets: 0,
            maxPerUser: maxPerUser,
            freeEntryEnabled: freeEntryEnabled,
            status: RoundStatus.Created,
            merkleRoot: bytes32(0),
            randomness: 0,
            winningTicket: 0,
            requestId: 0,
            createdAt: block.timestamp,
            startTime: startTime,
            endTime: endTime
        });

        emit RoundCreated(roundId, msg.sender, prizeId);
        return roundId;
    }

    function openRound(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Created, "Invalid round status");
        rounds[roundId].status = RoundStatus.Open;
        emit RoundOpened(roundId);
    }

    function sealRound(uint256 roundId, bytes32 merkleRoot, uint256 totalTickets) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Open || rounds[roundId].status == RoundStatus.Filled, "Cannot seal");
        rounds[roundId].merkleRoot = merkleRoot;
        rounds[roundId].totalTickets = totalTickets;
        rounds[roundId].status = RoundStatus.Sealed;
        emit RoundSealed(roundId, merkleRoot, totalTickets);
    }

    function requestRandomness(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.Sealed, "Round not sealed");
        require(address(vrfCoordinator) != address(0), "VRF not configured");

        uint256 requestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash,
            vrfSubId,
            3,
            200000,
            1
        );

        rounds[roundId].requestId = requestId;
        rounds[roundId].status = RoundStatus.RandomRequested;
        emit RandomnessRequested(roundId, requestId);
    }

    function fulfillRandomWords(uint256 roundId, uint256 randomness) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status == RoundStatus.RandomRequested, "Randomness not requested");

        rounds[roundId].randomness = randomness;
        rounds[roundId].winningTicket = (randomness % rounds[roundId].totalTickets) + 1;
        rounds[roundId].status = RoundStatus.Finalized;

        emit RoundFinalized(roundId, randomness, rounds[roundId].winningTicket);
    }

    function claimPrize(uint256 roundId, address claimant, bytes32[] calldata proof) external nonReentrant {
        require(rounds[roundId].status == RoundStatus.Finalized, "Round not finalized");
        require(!hasClaimed[roundId][claimant], "Already claimed");
        bytes32 prizeId = bytes32(rounds[roundId].prizeId);
        (, , , , , bool locked, ) = prizeVault.prizes(prizeId);
        require(locked, "Prize not locked");

        uint256 userStartTicket = userTickets[roundId][claimant];
        uint256 userEndTicket = userStartTicket + rounds[roundId].maxPerUser - 1;

        require(
            rounds[roundId].winningTicket >= userStartTicket && rounds[roundId].winningTicket <= userEndTicket,
            "Not a winner"
        );

        hasClaimed[roundId][claimant] = true;
        prizeVault.releasePrizeToWinner(prizeId, claimant);

        emit PrizeClaimed(roundId, claimant);
    }

    function cancelRound(uint256 roundId) external onlyRole(OPERATOR_ROLE) {
        require(rounds[roundId].status != RoundStatus.Completed && rounds[roundId].status != RoundStatus.Cancelled, "Cannot cancel");
        rounds[roundId].status = RoundStatus.Cancelled;
        emit RoundCancelled(roundId);
    }

    function getRoundInfo(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }
}
