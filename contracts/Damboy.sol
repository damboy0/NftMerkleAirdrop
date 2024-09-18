// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Damboy is ERC20("Damboy Token", "DMB") {
    address public owner;
    address public allowedContract;

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 1000000000000e18);
    }
}
