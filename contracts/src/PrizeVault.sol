// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PrizeVault is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ROUND_CREATOR_ROLE = keccak256("ROUND_CREATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct PrizeInfo {
        address sponsor;
        uint256 amount;
        address token;
        uint256 tokenId;
        bool isNFT;
        bool locked;
        address roundAddress;
    }

    mapping(bytes32 => PrizeInfo) public prizes;
    mapping(address => uint256) public erc20Balances;
    mapping(address => mapping(uint256 => address)) public nftOwners;

    event PrizeDeposited(
        bytes32 indexed prizeId,
        address indexed sponsor,
        uint256 amount,
        address token,
        uint256 tokenId,
        bool isNFT
    );
    event PrizeLocked(bytes32 indexed prizeId, address indexed roundAddress);
    event PrizeReleased(bytes32 indexed prizeId, address indexed winner, uint256 amount);
    event PrizeRefunded(bytes32 indexed prizeId, address indexed sponsor, uint256 amount);
    event EmergencyPause(address indexed pauser);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function depositERC20Prize(
        address token,
        uint256 amount,
        bytes32 prizeId
    ) external whenNotPaused nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(prizes[prizeId].sponsor == address(0), "Prize ID already exists");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        prizes[prizeId] = PrizeInfo({
            sponsor: msg.sender,
            amount: amount,
            token: token,
            tokenId: 0,
            isNFT: false,
            locked: false,
            roundAddress: address(0)
        });

        emit PrizeDeposited(prizeId, msg.sender, amount, token, 0, false);
    }

    function depositNFTPrize(
        address token,
        uint256 tokenId,
        bytes32 prizeId
    ) external whenNotPaused nonReentrant {
        require(token != address(0), "Invalid token address");
        require(prizes[prizeId].sponsor == address(0), "Prize ID already exists");

        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        prizes[prizeId] = PrizeInfo({
            sponsor: msg.sender,
            amount: 1,
            token: token,
            tokenId: tokenId,
            isNFT: true,
            locked: false,
            roundAddress: address(0)
        });

        emit PrizeDeposited(prizeId, msg.sender, 1, token, tokenId, true);
    }

    function lockPrizeForRound(bytes32 prizeId, address roundAddress) external onlyRole(OPERATOR_ROLE) {
        require(prizes[prizeId].sponsor != address(0), "Prize does not exist");
        require(!prizes[prizeId].locked, "Prize already locked");
        require(roundAddress != address(0), "Invalid round address");

        prizes[prizeId].locked = true;
        prizes[prizeId].roundAddress = roundAddress;

        emit PrizeLocked(prizeId, roundAddress);
    }

    function releasePrizeToWinner(bytes32 prizeId, address winner) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(prizes[prizeId].locked, "Prize not locked for any round");
        require(prizes[prizeId].roundAddress == msg.sender, "Caller is not the designated round");
        require(winner != address(0), "Invalid winner address");

        PrizeInfo storage prize = prizes[prizeId];
        prize.locked = false;

        if (prize.isNFT) {
            IERC721(prize.token).transferFrom(address(this), winner, prize.tokenId);
        } else {
            IERC20(prize.token).transfer(winner, prize.amount);
        }

        emit PrizeReleased(prizeId, winner, prize.amount);
    }

    function refundPrizeToSponsor(bytes32 prizeId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(prizes[prizeId].sponsor != address(0), "Prize does not exist");
        require(prizes[prizeId].locked, "Prize not locked");
        require(!prizes[prizeId].isNFT, "NFT prizes require manual handling");

        PrizeInfo storage prize = prizes[prizeId];
        prize.locked = false;

        IERC20(prize.token).transfer(prize.sponsor, prize.amount);

        emit PrizeRefunded(prizeId, prize.sponsor, prize.amount);
    }

    function emergencyPause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender);
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getPrizeInfo(bytes32 prizeId) external view returns (PrizeInfo memory) {
        return prizes[prizeId];
    }
}
