import { ethers } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const Dish = await ethers.getContractFactory("DishToken");
  const dish = await Dish.deploy();
  console.log("DishToken deployed to: ", dish.address);

  const Portion = await ethers.getContractFactory("PortionToken");
  const portion = await Portion.deploy(dish.address);
  console.log("PortionToken deployed to: ", portion.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
