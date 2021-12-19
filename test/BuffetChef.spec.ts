import chai, { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { waffle } from "hardhat";

import BuffetChef from "../artifacts/contracts/BuffetChef.sol/BuffetChef.json";
import DishToken from "../artifacts/contracts/DishToken.sol/DishToken.json";
import PortionToken from "../artifacts/contracts/PortionToken.sol/PortionToken.json";

import MockERC20 from "../artifacts/contracts/test/MockERC20.sol/MockERC20.json";

const { deployContract, createFixtureLoader } = waffle;

describe("BuffetChef", () => {
  const { provider } = waffle;
  const loadFixture = createFixtureLoader(provider.getWallets(), provider);

  async function deployLPToken(symbol: string, deployer: Wallet, supply: number = 1000000) {
    const lp = await deployContract(deployer, MockERC20, [symbol, symbol]);
    await lp.mint(deployer.address, supply);
    return lp;
  }

  async function advanceToBlockNumber(blockNumber: number) {
    const current = await provider.getBlockNumber();
    if (current > blockNumber) {
      throw new Error(
        `advanceToBlockNumber: current number ${current} is already passed ${blockNumber}.`
      );
    }

    for (let i = current; i < blockNumber; i++) {
      await provider.send("evm_mine", []);
    }
  }

  async function fixture([owner, dev, alice, bob]: Wallet[], provider: Web3Provider) {
    const dish = await deployContract(owner, DishToken);
    const portion = await deployContract(owner, PortionToken, [dish.address]);
    const chef = await deployContract(owner, BuffetChef, [
      dish.address,
      portion.address,
      dev.address,
      1000,
      100,
    ]);

    await dish.transferOwnership(chef.address);
    await portion.transferOwnership(chef.address);

    const lp = [];
    for (let i = 0; i < 10; i++) {
      const x = await deployLPToken(`LP${i}`, owner);
      lp.push(x);
    }

    await lp[0].transfer(alice.address, 2000);
    await lp[1].transfer(alice.address, 2000);
    await lp[2].transfer(alice.address, 2000);

    await lp[0].transfer(bob.address, 2000);
    await lp[1].transfer(bob.address, 2000);
    await lp[2].transfer(bob.address, 2000);

    // make block number move beyond chef starting block number.
    await advanceToBlockNumber(120);

    return { chef, dish, portion, owner, dev, alice, bob, lp };
  }

  it("basic", async () => {
    const { chef, dish, portion, owner, dev } = await loadFixture(fixture);
    expect(await chef.owner()).to.equal(owner.address);
    expect(await chef.devAddr()).to.equal(dev.address);

    expect(await dish.owner()).to.equal(chef.address);
    expect(await portion.owner()).to.equal(chef.address);
  });

  it("real case", async () => {
    const { chef, dish, lp, alice } = await loadFixture(fixture);

    await chef.add(2000, lp[0].address, true);
    await chef.add(1000, lp[1].address, true);
    await chef.add(500, lp[2].address, true);
    await chef.add(500, lp[3].address, true);
    await chef.add(500, lp[4].address, true);
    await chef.add(500, lp[5].address, true);
    await chef.add(500, lp[6].address, true);
    await chef.add(100, lp[7].address, true);
    await chef.add(100, lp[8].address, true);

    expect(await chef.poolLength()).to.equal(10);

    await lp[0].connect(alice).approve(chef.address, 1000);
    expect(await dish.balanceOf(alice.address)).to.equal(0);

    await chef.connect(alice).deposit(1, 20);
    await chef.connect(alice).withdraw(1, 20);
    expect(await dish.balanceOf(alice.address)).to.equal(263);

    await dish.connect(alice).approve(chef.address, 1000);
    await chef.connect(alice).enterStaking(20);
    await chef.connect(alice).enterStaking(0);
    await chef.connect(alice).enterStaking(0);
    await chef.connect(alice).enterStaking(0);

    expect(await dish.balanceOf(alice.address)).to.equal(993);
    expect((await chef.poolInfo(0)).allocPoint).to.equal(1900);
  });

  it("deposit/withdraw", async () => {
    const { chef, dish, lp, alice, bob, dev } = await loadFixture(fixture);

    await chef.add(1000, lp[0].address, true);
    await chef.add(1000, lp[1].address, true);
    await chef.add(1000, lp[2].address, true);

    await lp[0].connect(alice).approve(chef.address, 100);
    await chef.connect(alice).deposit(1, 20);
    await chef.connect(alice).deposit(1, 0);
    await chef.connect(alice).deposit(1, 40);
    await chef.connect(alice).deposit(1, 0);
    expect(await lp[0].balanceOf(alice.address)).to.equal(1940);

    await chef.connect(alice).withdraw(1, 10);
    expect(await lp[0].balanceOf(alice.address)).to.equal(1950);
    expect(await dish.balanceOf(alice.address)).to.equal(999);
    expect(await dish.balanceOf(dev.address)).to.equal(100);

    await lp[0].connect(bob).approve(chef.address, 100);
    expect(await lp[0].balanceOf(bob.address)).to.equal(2000);
    await chef.connect(bob).deposit(1, 50);
    await chef.connect(bob).deposit(1, 0);
    expect(await dish.balanceOf(bob.address)).to.equal(125);

    await chef.connect(bob).emergencyWithdraw(1);
    expect(await lp[0].balanceOf(bob.address)).to.equal(2000);
  });

  it("staking/unstaking", async () => {
    const { chef, dish, portion, lp, alice } = await loadFixture(fixture);

    await chef.add(1000, lp[0].address, true);
    await chef.add(1000, lp[1].address, true);
    await chef.add(1000, lp[2].address, true);

    await lp[0].connect(alice).approve(chef.address, 10);
    await chef.connect(alice).deposit(1, 2);
    await chef.connect(alice).withdraw(1, 2);
    expect(await dish.balanceOf(alice.address)).to.equal(250);

    await dish.connect(alice).approve(chef.address, 250);
    await chef.connect(alice).enterStaking(240);

    expect(await portion.balanceOf(alice.address)).to.equal(240);
    expect(await dish.balanceOf(alice.address)).to.equal(10);

    await chef.connect(alice).enterStaking(10);
    expect(await portion.balanceOf(alice.address)).to.equal(250);
    expect(await dish.balanceOf(alice.address)).to.equal(249);

    await chef.connect(alice).leaveStaking(250);
    expect(await portion.balanceOf(alice.address)).to.equal(0);
    expect(await dish.balanceOf(alice.address)).to.equal(749);
  });

  it("update multiplier", async () => {
    const { chef, dish, lp, alice, bob } = await loadFixture(fixture);

    await chef.add(1000, lp[0].address, true);
    await chef.add(1000, lp[1].address, true);
    await chef.add(1000, lp[2].address, true);

    await lp[0].connect(alice).approve(chef.address, 100);
    await lp[0].connect(bob).approve(chef.address, 100);

    await chef.connect(alice).deposit(1, 100);
    await chef.connect(bob).deposit(1, 100);
    await chef.connect(alice).deposit(1, 0);
    await chef.connect(bob).deposit(1, 0);

    await dish.connect(alice).approve(chef.address, 100);
    await dish.connect(bob).approve(chef.address, 100);

    await chef.connect(alice).enterStaking(50);
    await chef.connect(bob).enterStaking(100);

    await chef.updateMultiplier(0);

    await chef.connect(alice).enterStaking(0);
    await chef.connect(bob).enterStaking(0);
    await chef.connect(alice).deposit(1, 0);
    await chef.connect(bob).deposit(1, 0);

    expect(await dish.balanceOf(alice.address)).to.equal(700);
    expect(await dish.balanceOf(bob.address)).to.equal(150);

    advanceToBlockNumber(250);

    await chef.connect(alice).enterStaking(0);
    await chef.connect(bob).enterStaking(0);
    await chef.connect(alice).deposit(1, 0);
    await chef.connect(bob).deposit(1, 0);

    expect(await dish.balanceOf(alice.address)).to.equal(700);
    expect(await dish.balanceOf(bob.address)).to.equal(150);

    await chef.connect(alice).leaveStaking(50);
    await chef.connect(bob).leaveStaking(100);
    await chef.connect(alice).withdraw(1, 100);
    await chef.connect(bob).withdraw(1, 100);
  });

  it("should allow dev and only dev to update dev", async () => {
    const { chef, alice, bob, dev } = await loadFixture(fixture);

    await expect(chef.connect(bob).dev(alice.address)).to.be.revertedWith("DISH: not allowed");
    await chef.connect(dev).dev(bob.address);
    expect(await chef.devAddr()).to.equal(bob.address);
    await chef.connect(bob).dev(alice.address);
    expect(await chef.devAddr()).to.equal(alice.address);
  });
});
