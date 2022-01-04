// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface IBuffetChef {
    function deposit(uint256 pid, uint256 amount) external;

    function withdraw(uint256 pid, uint256 amount) external;

    function enterStaking(uint256 amount) external;

    function leaveStaking(uint256 amount) external;

    function pendingDish(uint256 pid, address user_) external view returns (uint256);

    function userInfo(uint256 pid, address user_) external view returns (uint256, uint256);

    function emergencyWithdraw(uint256 pid) external;
}
