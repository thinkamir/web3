// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DrawRoundManager {
    uint256 public latestRoundId;

    function createRound() external {
        latestRoundId += 1;
    }
}
