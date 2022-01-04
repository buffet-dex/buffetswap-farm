import { ethers, network } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

type NetworkConfig = {
  dishAddress: string;
  portionAddress: string;
  chefAddress: string;
};

const { DEV } = process.env;
const networkConfigs: { [name: string]: NetworkConfig } = {
  hardhat: {
    dishAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    portionAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    chefAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  avax_test: {
    dishAddress: "0xa53C113d8bE8930aa8430806F837277dAa43b4e4",
    portionAddress: "0x6865752fca5DC5Ee1C3d863Dd0D1fc3Aab2D4295",
    chefAddress: "0xC5482641cdec925E6777B5B8Cf58b50A786a2689",
  },
};

async function main() {
  const { DEV } = process.env;
  const config = networkConfigs[network.name];
  if (!config) {
    throw new Error(`Cannot get network config for name: ${network.name}`);
  }

  const { dishAddress, portionAddress, chefAddress } = config;

  const Vault = await ethers.getContractFactory("DishVault");
  const vault = await Vault.deploy(dishAddress, portionAddress, chefAddress, DEV, DEV);
  console.log("DishVault deployed to: ", vault.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
