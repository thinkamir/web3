// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MerkleEntryVerifier {
    bytes32 public merkleRoot;

    function setRoot(bytes32 root) external {
        merkleRoot = root;
    }
}
