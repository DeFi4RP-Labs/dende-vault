import { ethers, Contract } from "ethers";
import { DENDE_VAULT_CONTRACT_ADDRESS } from "./constants";

const provider = new ethers.JsonRpcProvider("https://sepolia-rpc.kakarot.org");
const DENDE_VAULT_ABI = [
    "function _deposit_deposit(uint _assets, uint chainId, address crossAsset, uint amount) public returns (uint256)",
    "function symbol() view returns (string)",
    "event BuyStrategy(uint256 chainId, address crossAsset, uint256 amount)"
];

const VaultContract = new Contract(
  DENDE_VAULT_CONTRACT_ADDRESS,
  DENDE_VAULT_ABI,
  provider
);

export const getBuyStrategyEvt = async () => {
  try {
    const blockNumber = await VaultContract.symbol();
    console.log("Listening to BuyStrategy event...");
    console.log("contract  ", blockNumber);
   VaultContract.on("*",
      //VaultContract.filters.BuyStrategy,
      async (chainId, crossAsset, shares, event) => {
        console.log("--->> \n", chainId, crossAsset, shares);
        // TODO: call api 0x to make a swap usdc/crossAsset
      }
    );
  } catch (error) {
    console.log("[Error] !!! ", error);
  }
};
getBuyStrategyEvt();
