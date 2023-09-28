import { Account } from "@ledgerhq/types-live";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import axios from "axios";
import {
  getAccountWalletAddress,
  getFromAmount,
  getNetworkId,
  getTokenAddress,
  isTokenAccount,
} from "./helpers";
import { ONEINCH_API_BASE_URL, ONEINCH_API_CLIENT_HEADERS } from "./consts";

export const queryAllowanceCheck = async (swapTransaction: SwapTransactionType) => {
  const fromAccount = swapTransaction.swap.from.account;
  const networkId = getNetworkId(fromAccount);
  const tokenAddress = getTokenAddress(fromAccount);
  const walletAddress = getAccountWalletAddress(swapTransaction);
  const parameters = new URLSearchParams({
    tokenAddress,
    walletAddress,
  });
  const url = `${ONEINCH_API_BASE_URL}/${networkId}/approve/allowance?${parameters.toString()}`;
  const response = await axios.get<{ allowance: string }>(url, {
    headers: ONEINCH_API_CLIENT_HEADERS,
  });
  return {
    fromAccount,
    networkId,
    tokenAddress,
    walletAddress,
    parameters,
    response,
  };
};

export const queryApproveTokenAllowanceTx = async (swapTransaction: SwapTransactionType) => {
  if (!isTokenAccount(swapTransaction.swap.from.account)) {
    throw new Error("Not a token account, no need to seek approval");
  }
  const fromAccount = swapTransaction.swap.from.account;
  const networkId = getNetworkId(fromAccount);
  const tokenAddress = getTokenAddress(fromAccount);
  const fromAmount = getFromAmount(swapTransaction);
  const parameters = new URLSearchParams({
    tokenAddress,
    amount: fromAmount.toString(),
  });
  const url = `${ONEINCH_API_BASE_URL}/${networkId}/approve/transaction?${parameters.toString()}`;
  const response = await axios.get<{
    data: string;
    gasPrice: string;
    to: string;
    value: string;
  }>(url, {
    headers: ONEINCH_API_CLIENT_HEADERS,
  });
  return {
    response,
  };
};

export const query1InchSwapTx = async (swapTransaction: SwapTransactionType) => {
  const toAccount = swapTransaction.swap.to.account;
  const fromAccount = swapTransaction.swap.from.account;

  const toTokenAddress = getTokenAddress(toAccount);
  const fromTokenAddress = getTokenAddress(fromAccount);
  const fromWalletAddress = getAccountWalletAddress(swapTransaction);
  const networkId = getNetworkId(fromAccount);
  const amount = getFromAmount(swapTransaction);

  if (!amount) throw new Error("Invalid amount value");

  const parameters = new URLSearchParams({
    src: fromTokenAddress,
    dst: toTokenAddress,
    from: fromWalletAddress,
    amount: amount.toString(),
    slippage: "0.5",
    referrer: fromWalletAddress,
    includeTokensInfo: "true",
    includeProtocols: "true",
    compatibility: "false",
    allowPartialFill: "false",
    /**
     * Define partner fee & fee receive address (referrer)
     */
    fee: "1",
  });
  const url = `${ONEINCH_API_BASE_URL}/${networkId}/swap?${parameters.toString()}`;
  const response = await axios.get<{
    tx: {
      to: string;
      data: string;
      value: string;
      gas: number;
      gasPrice: string;
    };
  }>(url, {
    headers: ONEINCH_API_CLIENT_HEADERS,
  });
  return response.data;
};
