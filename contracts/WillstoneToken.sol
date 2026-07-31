// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WillstoneToken is ERC20 {
    constructor() ERC20("Willstone Nexus Infra", "WNI") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
