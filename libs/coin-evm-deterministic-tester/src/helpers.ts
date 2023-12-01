import { ethers, providers } from "ethers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import ERC20ABI from "./abis/erc20.json";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";

export const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
export const ethereum = getCryptoCurrencyById("ethereum");
export const ERC20Interface = new ethers.utils.Interface(ERC20ABI);
export const USDC = getTokenById("ethereum/erc20/usd__coin");
