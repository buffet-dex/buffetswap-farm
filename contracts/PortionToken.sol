// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./DishToken.sol";

contract PortionToken is ERC20, Ownable {
    DishToken public immutable dish;

    constructor(DishToken d) ERC20("Buffetswap Portion Token", "PORTION") {
        dish = d;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        super._mint(to, amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        super._burn(account, amount);
    }

    // Just in case if rounding error causes pool to not have enough DISHs.
    function transferDishAtMost(address to, uint256 amount) public onlyOwner {
        uint256 balance = dish.balanceOf(address(this));
        if (amount > balance) {
            dish.transfer(to, balance);
        } else {
            dish.transfer(to, amount);
        }
    }
}
