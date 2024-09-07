import { ethers, Contract } from "ethers";
import 'dotenv/config';
import { Permit2Abi } from "./PermitAbi";
import { DENDE_VAULT_CONTRACT_ADDRESS } from "./constants";

const API_URL_BASE_0x = "https://api.0x.org/swap/permit2/";
const API_KEY_0x = process.env.API_KEY_0x;
const USER_ADDRESS = process.env.PUBLIC_KEY as string;
const op_usdc = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const op_mpETH = "0x819845b60a192167ed1139040b4f8eca31834f27";
const permit2Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const provider = new ethers.JsonRpcProvider("https://sepolia-rpc.kakarot.org");
const opProvider = new ethers.JsonRpcProvider("https://mainnet.optimism.io");

const DENDE_VAULT_ABI = [
    "function _deposit(uint _assets, uint chainId, address crossAsset, uint amount) public returns (uint256)",
    "function symbol() view returns (string)",
    "event BuyStrategy(uint256 chainId, address crossAsset, uint256 amount)"
];
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function transfer(address recipient, uint256 amount) public returns (bool)"
];

const VaultContract = new Contract(
  DENDE_VAULT_CONTRACT_ADDRESS,
  DENDE_VAULT_ABI,
  provider
);

const UsdcContract = new Contract(
    op_usdc,
    ERC20_ABI,
    opProvider
);

const Permit2Contract = new Contract(
    permit2Address,
    Permit2Abi,
    opProvider
);

export const makeSwap = async (chainId: string, assetAddress: string, amount: number) => {
  try {
    const signer = await opProvider.getSigner();
    console.log('Signer:', signer);
    const orderParams = new URLSearchParams({
        chainId, // / op mainnet. See the 0x Cheat Sheet for all supported endpoints: https://0x.org/docs/introduction/0x-cheat-sheet
        sellToken: op_usdc, //usdc
        buyToken: assetAddress, //mpETH
        sellAmount: '1000000', // Note that the WETH token uses 18 decimal places, so `sellAmount` is `100 * 10^18`.
        taker: USER_ADDRESS, //Address that will make the trade
    });

    await fetch(`${API_URL_BASE_0x}/price?${orderParams.toString()}`, {
    headers: {
        "Content-Type": "application/json",
        "0x-version": "2",
        "0x-api-key": API_KEY_0x as string,
    },
    method: "GET",
   }).then(async (res) => {
    console.log('Price:', await res.json());
    if (res.ok) {
        if (1000000 > (await UsdcContract.allowance([USER_ADDRESS, permit2Address])))
            try {
                UsdcContract.connect(signer);
                const { request } = await UsdcContract.approve.staticCall([permit2Address, 10000000]);
                console.log('Approving Permit2 to spend USDC...', request);
                // If not, write approval
                const hash = await UsdcContract.approve(request.args);
                console.log('Approved Permit2 to spend USDC.', await hash.wait());
            } catch (error) {
                console.log('Error approving Permit2:', error);
            }
        else {
            console.log('USDC already approved for Permit2');
        }
    }
   });
  
  } catch (error) {
    console.log("[Error] !!! ", error);
  }
};

makeSwap("10", op_mpETH, 100);