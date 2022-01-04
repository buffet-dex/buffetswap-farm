import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const Multicall = await ethers.getContractFactory("Multicall2");
  const mc = await Multicall.deploy();
  console.log("Multicall deployed to: ", mc.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
