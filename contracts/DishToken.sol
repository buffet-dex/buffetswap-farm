// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract DishToken is ERC20Votes, Ownable {
    constructor() ERC20("Buffetswap Token", "DISH") ERC20Permit("Buffetswap Token") {}

    function mint(address to, uint256 amount) public onlyOwner {
        super._mint(to, amount);
    }
}
