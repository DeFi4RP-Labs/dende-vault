import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import 'dotenv/config';

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    kakarot: {
      url: "https://sepolia-rpc.kakarot.org",
      chainId: 1802203764,
      accounts: [PRIVATE_KEY]
    }
  }
};

export default config;
