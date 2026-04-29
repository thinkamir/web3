// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PrizeVault.sol";

abstract contract MerkleEntryVerifier is AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    PrizeVault public prizeVault;

    mapping(uint256 => mapping(bytes32 => bool)) public merkleProofs;
    mapping(uint256 => address[]) public roundParticipants;
    mapping(uint256 => mapping(address => bytes32)) public userMerkleLeafs;

    event MerkleLeafAdded(uint256 indexed roundId, address indexed user, bytes32 leaf);
    event MerkleRootGenerated(uint256 indexed roundId, bytes32 root);

    constructor(address _prizeVault) {
        prizeVault = PrizeVault(_prizeVault);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    function addMerkleLeaf(
        uint256 roundId,
        address user,
        uint256 startTicket,
        uint256 endTicket,
        bytes32 leaf
    ) internal {
        require(merkleProofs[roundId][leaf] == false, "Leaf already added");

        merkleProofs[roundId][leaf] = true;
        userMerkleLeafs[roundId][user] = leaf;
        roundParticipants[roundId].push(user);

        emit MerkleLeafAdded(roundId, user, leaf);
    }

    function generateMerkleRoot(uint256 roundId) internal view returns (bytes32) {
        address[] memory participants = roundParticipants[roundId];
        require(participants.length > 0, "No participants");

        bytes32[] memory leaves = new bytes32[](participants.length);
        for (uint256 i = 0; i < participants.length; i++) {
            leaves[i] = userMerkleLeafs[roundId][participants[i]];
        }

        return computeMerkleRoot(leaves);
    }

    function computeMerkleRoot(bytes32[] memory leaves) internal pure returns (bytes32) {
        require(leaves.length > 0, "No leaves");

        bytes32[] memory currentLevel = leaves;
        bytes32[] memory nextLevel = new bytes32[]((currentLevel.length + 1) / 2);

        while (currentLevel.length > 1) {
            for (uint256 i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel[i / 2] = keccak256(abi.encodePacked(currentLevel[i], currentLevel[i + 1]));
                } else {
                    nextLevel[i / 2] = keccak256(abi.encodePacked(currentLevel[i], bytes32(0)));
                }
            }
            currentLevel = nextLevel;
            nextLevel = new bytes32[]((currentLevel.length + 1) / 2);
        }

        return currentLevel[0];
    }

    function verifyWinningEntry(
        uint256 roundId,
        address user,
        uint256 startTicket,
        uint256 endTicket,
        bytes32[] calldata proof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user, startTicket, endTicket));
        bytes32 root = userMerkleLeafs[roundId][user];

        return verifyMerkleProof(proof, root, leaf);
    }

    function verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 current = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            current = keccak256(abi.encodePacked(current, proof[i]));
        }

        return current == root;
    }

    function getParticipantCount(uint256 roundId) external view returns (uint256) {
        return roundParticipants[roundId].length;
    }

    function getUserMerkleLeaf(uint256 roundId, address user) external view returns (bytes32) {
        return userMerkleLeafs[roundId][user];
    }
}
