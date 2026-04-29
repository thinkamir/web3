// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PrizeVault.sol";
import "../src/DrawRoundManager.sol";

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

    function test_InitialState() public {
        assertFalse(vault.paused());
    }

    function test_EmergencyPause() public {
        vault.emergencyPause();
        assertTrue(vault.paused());
    }

    function test_OnlyPauserCanPause() public {
        vm.prank(operator);
        vm.expectRevert();
        vault.emergencyPause();
    }

    function test_Unpause() public {
        vault.emergencyPause();
        assertTrue(vault.paused());

        vault.unpause();
        assertFalse(vault.paused());
    }

    function test_GetPrizeInfo() public {
        uint256 prizeId = 1;
        PrizeVault.PrizeInfo memory info = vault.getPrizeInfo(prizeId);
        assertEq(info.sponsor, address(0));
    }
}

contract DrawRoundManagerTest is Test {
    DrawRoundManager public drawManager;
    PrizeVault public vault;
    address public admin;
    address public operator;
    address public creator;
    address public user1;
    address public user2;

    function setUp() public {
        admin = address(this);
        operator = makeAddr("operator");
        creator = makeAddr("creator");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

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

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(round.targetPoints, 1000);
        assertEq(round.pointsPerTicket, 1);
        assertEq(uint256(round.status), 0);
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

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 1);
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

        address[] memory users = new address[](1);
        uint256[] memory startTickets = new uint256[](1);
        uint256[] memory endTickets = new uint256[](1);
        users[0] = user1;
        startTickets[0] = 1;
        endTickets[0] = 10;
        vm.prank(operator);
        drawManager.commitBatch(roundId, users, startTickets, endTickets);

        vm.prank(operator);
        drawManager.sealRound(roundId);

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(round.merkleRoot, keccak256("test-merkle-root"));
        assertEq(round.totalTickets, 10);
        assertEq(uint256(round.status), 3);
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

        address[] memory users2 = new address[](1);
        uint256[] memory startTickets2 = new uint256[](1);
        uint256[] memory endTickets2 = new uint256[](1);
        users2[0] = user1;
        startTickets2[0] = 1;
        endTickets2[0] = 10;
        vm.prank(operator);
        drawManager.commitBatch(roundId, users2, startTickets2, endTickets2);

        vm.prank(operator);
        drawManager.sealRound(roundId);

        vm.prank(operator);
        drawManager.fulfillRandomWords(roundId, 12345);

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(round.randomness, 12345);
        assertEq(round.winningTicket, 46);
        assertEq(uint256(round.status), 5);
    }

    function test_WinningTicketCalculation() public {
        uint256 totalTickets = 1000;
        uint256 randomness = 12345;
        uint256 winningTicket = (randomness % totalTickets) + 1;
        assertEq(winningTicket, 46);
    }

    function test_RoundLifecycle() public {
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

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 0);
        assertEq(round.creator, creator);

        vm.prank(operator);
        drawManager.openRound(roundId);
        round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 1);

        vm.prank(operator);
        drawManager.requestRandomness(roundId);
        round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 4);

        vm.prank(operator);
        drawManager.fulfillRandomWords(roundId, 777);
        round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 5);
    }

    function test_CancelRound() public {
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
        drawManager.cancelRound(roundId);

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(uint256(round.status), 8);
    }

    function test_GetRoundInfo() public {
        vm.prank(creator);
        uint256 roundId = drawManager.createRound(
            123,
            2000,
            2,
            5,
            true,
            block.timestamp + 200,
            block.timestamp + 2000
        );

        DrawRoundManager.Round memory round = drawManager.getRoundInfo(roundId);
        assertEq(round.prizeId, 123);
        assertEq(round.targetPoints, 2000);
        assertEq(round.pointsPerTicket, 2);
        assertEq(round.maxPerUser, 5);
        assertTrue(round.freeEntryEnabled);
    }
}
