import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";

import { TokenAddress } from "./consts";
import { getParentAccount } from "@ledgerhq/live-common/account/index";

type GetAccountIdProps = {
  accounts: Account[];
  accountId?: string;
};

/**
 * Same as apps/ledger-live-mobile/src/hooks/transactions/useSwapTransactionHelper.ts
 * TODO: Decouple this logic in LLC?
 *
 * Helper extracted from LLM/Screens/Swap/Form/index.tsx onSubmit function
 * (Removed wallet api related logic e.g Wallet api partner list check, wallet api id retrieval)
 *
 * @param {Account[]} List of accounts (from redux)
 * @param {string} Account id
 * @returns {
 *  Account,
 *  AccountId
 *  ParentAccount
 * }
 */
export const getAccountId = ({ accounts, accountId }: GetAccountIdProps) => {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return { accountId };
  const parentAccount = isTokenAccount(account) ? getParentAccount(account, accounts) : undefined;
  return {
    account,
    accountId,
    parentAccount,
  };
};

export const getAccountWalletAddress = (swapTransaction: SwapTransactionType) => {
  if (swapTransaction.parentAccount) {
    return swapTransaction.parentAccount.freshAddress;
  }
  if (isAccount(swapTransaction.account)) {
    return swapTransaction.account.freshAddress;
  }
  throw new Error("Unknown account type, unable to get wallet address");
};

export const getTokenAddress = (account: AccountLike | undefined) => {
  if (isTokenAccount(account)) {
    return account.token.contractAddress;
  }
  if (isAccount(account)) {
    // Default to native currency
    return TokenAddress.EthAddress;
  }
  throw new Error("Unknown account type, unable to get token address");
};

export const getNetworkId = (account: AccountLike | undefined) => {
  if (isTokenAccount(account)) {
    return account.token.parentCurrency.ethereumLikeInfo?.networkId;
  }
  if (isAccount(account)) {
    return account.currency.ethereumLikeInfo?.networkId;
  }
  throw new Error("Unknown account type, unable to get chain id");
};

export const getFromAmount = (swapTransaction: SwapTransactionType) => {
  if (!swapTransaction.transaction?.amount) {
    throw new Error("Unable to get swap from amount");
  }
  return swapTransaction.transaction.amount;
};

export const hasCurrency = (value: unknown): value is Pick<Account, "currency"> =>
  Boolean(value && typeof value === "object" && "currency" in value);

export const isTokenAccount = (value: unknown): value is TokenAccount =>
  Boolean(value && typeof value === "object" && "type" in value && value.type === "TokenAccount");

export const isAccount = (value: unknown): value is Account =>
  Boolean(value && typeof value === "object" && "type" in value && value.type === "Account");
