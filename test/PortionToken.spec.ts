import chai, { expect } from "chai";
import { Contract } from "ethers";
import { waffle } from "hardhat";

import DishToken from "../artifacts/contracts/DishToken.sol/DishToken.json";
import PortionToken from "../artifacts/contracts/PortionToken.sol/PortionToken.json";

const { deployContract } = waffle;

describe("PortionToken", () => {
  const [wallet, walletTo] = waffle.provider.getWallets();
  let dish: Contract;
  let token: Contract;

  beforeEach(async () => {
    dish = await deployContract(wallet, DishToken);
    token = await deployContract(wallet, PortionToken, [dish.address]);
  });

  it("basic", async () => {
    expect(await token.symbol()).to.equal("PORTION");
    expect(await token.owner()).to.equal(wallet.address);
  });

  it("mint by owner", async () => {
    await token.mint(walletTo.address, 1000);
    expect(await token.totalSupply()).to.equal(1000);
    expect(await token.balanceOf(walletTo.address)).to.equal(1000);

    await token.mint(walletTo.address, 1000);
    expect(await token.totalSupply()).to.equal(2000);
    expect(await token.balanceOf(walletTo.address)).to.equal(2000);
  });

  it("burn by owner", async () => {
    await token.mint(walletTo.address, 1000);
    expect(await token.totalSupply()).to.equal(1000);
    expect(await token.balanceOf(walletTo.address)).to.equal(1000);

    await token.burn(walletTo.address, 600);
    expect(await token.totalSupply()).to.equal(400);
    expect(await token.balanceOf(walletTo.address)).to.equal(400);
  });

  it("mint by others", async () => {
    const other = token.connect(walletTo);
    await expect(other.mint(walletTo.address, 1000)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("burn by others", async () => {
    const other = token.connect(walletTo);
    await expect(other.burn(walletTo.address, 1000)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
