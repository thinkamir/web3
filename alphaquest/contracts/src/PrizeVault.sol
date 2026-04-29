// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PrizeVault {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }
}
