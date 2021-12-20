/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import "@nomiclabs/hardhat-waffle";
import dotenv from "dotenv";
dotenv.config();

const accounts = process.env.DEPLOY_ACCOUNT ? [process.env.DEPLOY_ACCOUNT] : undefined;

export default {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  networks: {
    hardhat: {},
    bsc_test: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts,
    },
  },
};
