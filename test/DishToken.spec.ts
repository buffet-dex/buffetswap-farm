import chai, { expect } from "chai";
import { Contract } from "ethers";
import { waffle } from "hardhat";

import DishToken from "../artifacts/contracts/DishToken.sol/DishToken.json";

const { deployContract } = waffle;

describe("DishToken", () => {
  const [wallet, walletTo] = waffle.provider.getWallets();
  let token: Contract;

  beforeEach(async () => {
    token = await deployContract(wallet, DishToken);
  });

  it("basic", async () => {
    expect(await token.symbol()).to.equal("DISH");
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

  it("mint by others", async () => {
    const other = token.connect(walletTo);
    await expect(other.mint(walletTo.address, 1000)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
