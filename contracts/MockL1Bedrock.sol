// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockL1Bedrock
 * @notice Mock L1 Bedrock bridge contract for testing Solar Export logic.
 */
contract MockL1Bedrock {
    event ETHDeposited(uint256 amount, bytes data);
    
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    function depositETH(uint256 amount, bytes calldata data) external payable {
        require(msg.value >= amount, "Insufficient ETH");
        deposits[msg.sender] += amount;
        totalDeposits += amount;
        emit ETHDeposited(amount, data);
    }

    receive() external payable {
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }
}
