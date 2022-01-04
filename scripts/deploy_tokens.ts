import { ethers, network } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const Dish = await ethers.getContractFactory("DishToken");
  const dish = await Dish.deploy();
  console.log("DishToken deployed to: ", dish.address);

  const Portion = await ethers.getContractFactory("PortionToken");
  const portion = await Portion.deploy(dish.address);
  console.log("PortionToken deployed to: ", portion.address);

  if (network.name === "avax_test") {
    const USDC = await ethers.getContractFactory("MockERC20");
    const usdc = await USDC.deploy("Mock USDC", "USDC");
    console.log("Mock USDC deployed to: ", usdc.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
