// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NexusGuildTreasury {
    event UpchainLiquidation(address indexed engine, uint256 value);
    
    function processDunaBridge() external payable {
        emit UpchainLiquidation(msg.sender, msg.value);
    }
}