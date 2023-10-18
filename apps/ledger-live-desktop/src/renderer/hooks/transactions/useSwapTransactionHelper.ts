import { useSelector } from "react-redux";

import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";

import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { query1InchSwapTx } from "./query";
import { getAccountId } from "./helpers";
import { use1InchSignTransactionHelpers } from "./useSignTransactionHelpers";
import BigNumber from "bignumber.js";

type OnSwapProps = {
  swapTransaction: SwapTransactionType;
};

export const useSwapTransactionHelper = () => {
  const toaster = useToasts();
  const accounts = useSelector(shallowAccountsSelector);
  const signTransactionHelpers = use1InchSignTransactionHelpers();

  const buildDexTransaction = async (swapTransaction: SwapTransactionType) => {
    const response = await query1InchSwapTx(swapTransaction);
    const amount = new BigNumber(parseInt(response.tx.value));
    const txData = Buffer.from(response.tx.data.replace("0x", ""), "hex");
    const recipient = response.tx.to;
    swapTransaction.updateTransaction(transaction => {
      transaction.recipient = recipient;
      transaction.feesStrategy = "slow";
      transaction.amount = amount;
      (transaction as any).data = txData;
      return transaction;
    });
    return swapTransaction.transaction;
  };

  const onSwap = async ({ swapTransaction }: OnSwapProps) => {
    const from = swapTransaction.swap.from;
    const fromAccountId = from.parentAccount?.id || from.account?.id;
    const { account, accountId } = getAccountId({
      accounts,
      accountId: fromAccountId,
    });

    /**
     * signTransactionLogic expect transaction's (RawPlatformTransaction) amount to be a string
     * However I'm not sure this is correct, should be a BigNumber I think
     *
     * TODO: Fix typing
     *  RawPlatformTransaction expects data to be a string however it can be a buffer
     */
    try {
      if (!accountId) throw new Error("Missing account id");
      if (!account) throw new Error("Missing account");
      if (!swapTransaction.transaction) throw new Error("Invalid transaction object");

      const tx: any | null = await buildDexTransaction(swapTransaction);
      if (!tx) throw new Error("Missing transaction to sign");

      const transaction = await signTransactionHelpers.signAndBroadcastTransaction({
        appId: "1inch",
        accountId,
        tx,
      });

      console.log("[swap] tx signed", {
        tx: transaction.txId,
        signedTx: transaction.signedTransaction,
      });
    } catch (e) {
      toaster.pushToast({
        id: "some-id",
        icon: "info",
        title: "Unable to perform DEX swap",
        text: (e as Error).message,
      });
      console.log("[swap] tx sign error", e);
    }
  };
  return onSwap;
};
