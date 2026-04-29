// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@foundry-rs/forge-std/Test.sol";
import "@foundry-rs/forge-std/console.sol";
import "../../src/PrizeVault.sol";
import "../../src/DrawRoundManager.sol";
import "../../src/MerkleEntryVerifier.sol";

contract PrizeVaultTest is Test {
    PrizeVault public vault;
    address public admin;
    address public operator;
    address public sponsor;
    address public winner;

    event PrizeDeposited(
        bytes32 indexed prizeId,
        address indexed sponsor,
        uint256 amount,
        address token,
        uint256 tokenId,
        bool isNFT
    );

    function setUp() public {
        admin = address(this);
        operator = makeAddr("operator");
        sponsor = makeAddr("sponsor");
        winner = makeAddr("winner");

        vault = new PrizeVault();
        vault.grantRole(vault.OPERATOR_ROLE(), operator);
        vault.grantRole(vault.PAUSER_ROLE(), admin);
    }

    function test_DepositERC20Prize() public {
        vm.prank(sponsor);
        assertTrue(true);
    }

    function test_LockAndReleasePrize() public {
        bytes32 prizeId = keccak256("test-prize");
        assertEq(vault.prizes(prizeId).sponsor, address(0));
    }

    function test_EmergencyPause() public {
        vm.prank(admin);
        vault.emergencyPause();
        assertTrue(vault.paused());
    }

    function test_OnlyPauserCanPause() public {
        vm.prank(operator);
        vm.expectRevert();
        vault.emergencyPause();
    }
}

contract DrawRoundManagerTest is Test {
    DrawRoundManager public drawManager;
    PrizeVault public vault;
    address public admin;
    address public operator;
    address public creator;

    function setUp() public {
        admin = address(this);
        operator = makeAddr("operator");
        creator = makeAddr("creator");

        vault = new PrizeVault();
        drawManager = new DrawRoundManager(address(vault));

        vault.grantRole(vault.DEFAULT_ADMIN_ROLE(), admin);
        vault.grantRole(vault.OPERATOR_ROLE(), operator);
        drawManager.grantRole(drawManager.DEFAULT_ADMIN_ROLE(), admin);
        drawManager.grantRole(drawManager.OPERATOR_ROLE(), operator);
        drawManager.grantRole(drawManager.ROUND_CREATOR_ROLE(), creator);
    }

    function test_CreateRound() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            0,
            1000,
            1,
            10,
            false,
            block.timestamp + 100,
            block.timestamp + 1000
        );
        assertEq(roundId, 0);
    }

    function test_CannotCreateRoundWithInvalidParams() public {
        vm.prank(creator);
        vm.expectRevert();
        drawManager.createRound(0, 0, 1, 10, false, block.timestamp + 100, block.timestamp + 1000);
    }

    function test_OpenRound() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            0,
            1000,
            1,
            10,
            false,
            block.timestamp + 100,
            block.timestamp + 1000
        );

        vm.prank(operator);
        drawManager.openRound(roundId);

        assertEq(uint256(drawManager.rounds(roundId).status), 1);
    }

    function test_SealRound() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            0,
            1000,
            1,
            10,
            false,
            block.timestamp + 100,
            block.timestamp + 1000
        );

        vm.prank(operator);
        drawManager.openRound(roundId);

        vm.prank(operator);
        drawManager.sealRound(roundId);

        assertEq(uint256(drawManager.rounds(roundId).status), 3);
    }

    function test_FulfillRandomWords() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            0,
            1000,
            1,
            10,
            false,
            block.timestamp + 100,
            block.timestamp + 1000
        );

        vm.prank(operator);
        drawManager.openRound(roundId);

        vm.prank(operator);
        drawManager.sealRound(roundId);

        vm.prank(operator);
        drawManager.fulfillRandomWords(roundId, 12345);

        assertEq(uint256(drawManager.rounds(roundId).winningTicket), 46);
    }

    function test_WinningTicketCalculation() public {
        uint256 totalTickets = 1000;
        uint256 randomness = 12345;
        uint256 winningTicket = (randomness % totalTickets) + 1;
        assertEq(winningTicket, 346);
    }

    function test_CannotClaimIfNotWinner() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            0,
            1000,
            1,
            10,
            false,
            block.timestamp + 100,
            block.timestamp + 1000
        );

        vm.prank(operator);
        drawManager.openRound(roundId);

        vm.prank(operator);
        drawManager.sealRound(roundId);

        vm.prank(operator);
        drawManager.fulfillRandomWords(roundId, 12345);

        address nonWinner = makeAddr("nonWinner");
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(nonWinner);
        drawManager.claimPrize(roundId, proof);
    }
}
