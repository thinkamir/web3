// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@foundry-rs/forge-std/Script.sol";
import "@foundry-rs/forge-std/console.sol";
import "../../src/PrizeVault.sol";
import "../../src/DrawRoundManager.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PrizeVault prizeVault = new PrizeVault();
        console.log("PrizeVault deployed at:", address(prizeVault));

        DrawRoundManager drawManager = new DrawRoundManager(address(prizeVault));
        console.log("DrawRoundManager deployed at:", address(drawManager));

        vm.stopBroadcast();
    }
}
