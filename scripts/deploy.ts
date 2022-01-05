import { readFile, writeFile } from "fs/promises";
import fs from "fs";
import path from "path";

import { ethers, network } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

type DeployState = {
  dishToken: string;
  portionToken: string;
  chef: string;
  multicall: string;
  vault: string;

  mockUSDToken: string;
};

type DeployConfig = {
  dishPerBlock: string;
  startBlock: string;
};

const STATE_FILE = path.join(__dirname, `deploy-${network.name}.json`);
const EMPTY_STATE: DeployState = {
  dishToken: "",
  portionToken: "",
  chef: "",
  multicall: "",
  vault: "",

  mockUSDToken: "",
};

async function loadState(): Promise<DeployState> {
  if (!fs.existsSync(STATE_FILE)) {
    return EMPTY_STATE;
  }

  const content = await readFile(STATE_FILE, "utf-8");
  return JSON.parse(content);
}

async function saveState(state: DeployState) {
  if (network.name === "hardhat") {
    return;
  }

  const content = JSON.stringify(state, null, 2);
  await writeFile(STATE_FILE, content, "utf-8");
}

function getDeployConfig(): DeployConfig {
  switch (network.name) {
    case "hardhat":
      return { dishPerBlock: "40" + "0".repeat(18), startBlock: "0" };
    case "avax_test":
      return { dishPerBlock: "40" + "0".repeat(18), startBlock: "0" };
    default:
      throw new Error(`Unknown network: ${network.name}`);
  }
}

async function deployDishToken(state: DeployState): Promise<DeployState> {
  if (state.dishToken) {
    console.info("Using existing Dish Token contract:", state.dishToken);
    return state;
  }

  const Dish = await ethers.getContractFactory("DishToken");
  const dish = await Dish.deploy();
  console.log("DishToken deployed to:", dish.address);

  return Object.assign({}, state, { dishToken: dish.address });
}

async function deployPortionToken(state: DeployState): Promise<DeployState> {
  if (state.portionToken) {
    console.info("Using existing Portion Token contract:", state.portionToken);
    return state;
  }

  const Portion = await ethers.getContractFactory("PortionToken");
  const portion = await Portion.deploy(state.dishToken);
  console.log("PortionToken deployed to:", portion.address);

  return Object.assign({}, state, { portionToken: portion.address });
}

async function deployMockUSDC(state: DeployState): Promise<DeployState> {
  if (state.mockUSDToken) {
    console.info("Using existing Mock USD Token contract:", state.mockUSDToken);
    return state;
  }

  const MockUSD = await ethers.getContractFactory("MockERC20");
  const usd = await MockUSD.deploy("Mock USD", "USDC");
  console.log("Mock USD deployed to:", usd.address);

  return Object.assign({}, state, { mockUSDToken: usd.address });
}

async function deployMulticall(state: DeployState): Promise<DeployState> {
  if (state.multicall) {
    console.info("Using existing Multicall contract:", state.multicall);
    return state;
  }

  const Multicall = await ethers.getContractFactory("Multicall2");
  const mc = await Multicall.deploy();
  console.log("Multicall deployed to:", mc.address);

  return Object.assign({}, state, { multicall: mc.address });
}

async function deployChef(state: DeployState, config: DeployConfig): Promise<DeployState> {
  if (state.chef) {
    console.info("Using existing Chef contract:", state.chef);
    return state;
  }

  const signers = await ethers.getSigners();
  const owner = signers[0].address;

  const Chef = await ethers.getContractFactory("BuffetChef");
  const chef = await Chef.deploy(
    state.dishToken,
    state.portionToken,
    owner,
    config.dishPerBlock,
    config.startBlock
  );
  console.log("BuffetChef deployed to:", chef.address);

  return Object.assign({}, state, { chef: chef.address });
}

async function deployDishVault(state: DeployState): Promise<DeployState> {
  if (state.vault) {
    console.info("Using existing DishVault contract:", state.vault);
    return state;
  }

  const signers = await ethers.getSigners();
  const owner = signers[0].address;

  const Vault = await ethers.getContractFactory("DishVault");
  const vault = await Vault.deploy(state.dishToken, state.portionToken, state.chef, owner, owner);
  console.log("DishVault deployed to:", vault.address);

  return Object.assign({}, state, { vault: vault.address });
}

async function main() {
  const config = getDeployConfig();
  let state = await loadState();

  state = await deployDishToken(state);
  await saveState(state);

  state = await deployPortionToken(state);
  await saveState(state);

  if (network.name === "avax_test" || network.name === "hardhat") {
    state = await deployMockUSDC(state);
    await saveState(state);
  }

  state = await deployMulticall(state);
  await saveState(state);

  state = await deployChef(state, config);
  await saveState(state);

  state = await deployDishVault(state);
  await saveState(state);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
