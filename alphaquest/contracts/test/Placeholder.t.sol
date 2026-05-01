// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {PrizeVault} from "../src/PrizeVault.sol";
import {DrawRoundManager} from "../src/DrawRoundManager.sol";
import {MerkleEntryVerifier} from "../src/MerkleEntryVerifier.sol";

contract PlaceholderTest is Test {
    function testPrizeVaultOwnerSet() public {
        PrizeVault vault = new PrizeVault(address(this));
        assertEq(vault.owner(), address(this));
    }

    function testCreateRoundIncrements() public {
        DrawRoundManager manager = new DrawRoundManager();
        manager.createRound();
        assertEq(manager.latestRoundId(), 1);
    }

    function testSetRoot() public {
        MerkleEntryVerifier verifier = new MerkleEntryVerifier();
        bytes32 root = keccak256("root");
        verifier.setRoot(root);
        assertEq(verifier.merkleRoot(), root);
    }
}
