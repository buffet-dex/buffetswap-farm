// SPDX-License-Identifier: MIT

pragma solidity =0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/IBuffetChef.sol";
import "./DishToken.sol";
import "./PortionToken.sol";

contract BuffetChef is Ownable, IBuffetChef {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.

        // Any point in time, the amount of DISHs entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accDishPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accDishPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. DISHs to distribute per block.
        uint256 lastRewardBlock; // Last block number that DISHs distribution occurs.
        uint256 accDishPerShare; // Accumulated DISHs per share, times 1e12. See below.
    }

    DishToken public dish;
    PortionToken public portion;

    address public devAddr;
    uint256 public dishPerBlock;
    uint256 public bonusMultiplier = 1; // Bonus muliplier for early dish makers.

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when DISH mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        DishToken dish_,
        PortionToken portion_,
        address devAddr_,
        uint256 dishPerBlock_,
        uint256 startBlock_
    ) {
        dish = dish_;
        portion = portion_;
        devAddr = devAddr_;
        dishPerBlock = dishPerBlock_;
        startBlock = startBlock_;

        // manual DISH staking pool
        poolInfo.push(
            PoolInfo({
                lpToken: dish,
                allocPoint: 1000,
                lastRewardBlock: startBlock,
                accDishPerShare: 0
            })
        );

        totalAllocPoint = 1000;
    }

    function updateMultiplier(uint256 bonusMultiplier_) public onlyOwner {
        bonusMultiplier = bonusMultiplier_;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 allocPoint,
        IERC20 lpToken,
        bool withUpdate
    ) public onlyOwner {
        if (withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: lpToken,
                allocPoint: allocPoint,
                lastRewardBlock: lastRewardBlock,
                accDishPerShare: 0
            })
        );
        updateStakingPool();
    }

    // Update the given pool's DISH allocation point. Can only be called by the owner.
    function set(
        uint256 pid,
        uint256 allocPoint,
        bool withUpdate
    ) public onlyOwner {
        if (withUpdate) {
            massUpdatePools();
        }

        uint256 prevAllocPoint = poolInfo[pid].allocPoint;
        if (prevAllocPoint != allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(allocPoint);
            poolInfo[pid].allocPoint = allocPoint;
            updateStakingPool();
        }
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points = points.add(poolInfo[pid].allocPoint);
        }
        if (points != 0) {
            points = points.div(3);
            totalAllocPoint = totalAllocPoint.sub(poolInfo[0].allocPoint).add(points);
            poolInfo[0].allocPoint = points;
        }
    }

    // Return reward multiplier over the given fromBlock to toBlock block.
    function getMultiplier(uint256 fromBlock, uint256 toBlock) public view returns (uint256) {
        return toBlock.sub(fromBlock).mul(bonusMultiplier);
    }

    // View function to see pending DISHs on frontend.
    function pendingDish(uint256 pid, address user_) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][user_];
        uint256 accDishPerShare = pool.accDishPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 dishReward = multiplier.mul(dishPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );
            accDishPerShare = accDishPerShare.add(dishReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accDishPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 dishReward = multiplier.mul(dishPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        dish.mint(devAddr, dishReward.div(10));
        dish.mint(address(portion), dishReward);
        pool.accDishPerShare = pool.accDishPerShare.add(dishReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for DISH allocation.
    function deposit(uint256 pid, uint256 amount) public {
        require(pid != 0, "DISH: deposit DISH by staking.");

        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        updatePool(pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accDishPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                transferDishAtMost(msg.sender, pending);
            }
        }
        if (amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), amount);
            user.amount = user.amount.add(amount);
        }
        user.rewardDebt = user.amount.mul(pool.accDishPerShare).div(1e12);
        emit Deposit(msg.sender, pid, amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 pid, uint256 amount) public {
        require(pid != 0, "DISH: withdraw DISH by unstaking.");

        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.amount >= amount, "DISH: over withdraw.");
        updatePool(pid);
        uint256 pending = user.amount.mul(pool.accDishPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            transferDishAtMost(msg.sender, pending);
        }
        if (amount > 0) {
            user.amount = user.amount.sub(amount);
            pool.lpToken.safeTransfer(address(msg.sender), amount);
        }
        user.rewardDebt = user.amount.mul(pool.accDishPerShare).div(1e12);
        emit Withdraw(msg.sender, pid, amount);
    }

    // Stake DISH tokens to BuffetChef
    function enterStaking(uint256 amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accDishPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                transferDishAtMost(msg.sender, pending);
            }
        }
        if (amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), amount);
            user.amount = user.amount.add(amount);
        }
        user.rewardDebt = user.amount.mul(pool.accDishPerShare).div(1e12);

        portion.mint(msg.sender, amount);
        emit Deposit(msg.sender, 0, amount);
    }

    // Withdraw DISH tokens from STAKING.
    function leaveStaking(uint256 amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= amount, "DISH: over withdraw.");
        updatePool(0);
        uint256 pending = user.amount.mul(pool.accDishPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            transferDishAtMost(msg.sender, pending);
        }
        if (amount > 0) {
            user.amount = user.amount.sub(amount);
            pool.lpToken.safeTransfer(address(msg.sender), amount);
        }
        user.rewardDebt = user.amount.mul(pool.accDishPerShare).div(1e12);

        portion.burn(msg.sender, amount);
        emit Withdraw(msg.sender, 0, amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe dish transfer function, just in case if rounding error causes pool to not have enough DISHs.
    function transferDishAtMost(address to, uint256 amount) internal {
        portion.transferDishAtMost(to, amount);
    }

    // Update dev address by the previous dev.
    function dev(address devAddr_) public {
        require(msg.sender == devAddr, "DISH: not allowed");
        devAddr = devAddr_;
    }
}
