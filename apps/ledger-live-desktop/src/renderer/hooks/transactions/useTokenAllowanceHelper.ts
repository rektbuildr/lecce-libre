import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";

import { queryAllowanceCheck, queryApproveTokenAllowanceTx } from "./query";
import BigNumber from "bignumber.js";
import { getAccountId, getFromAmount } from "./helpers";

import { use1InchSignTransactionHelpers } from "./useSignTransactionHelpers";

export const useTokenAllowanceHelper = () => {
  const signTransactionHelpers = use1InchSignTransactionHelpers();
  const toaster = useToasts();
  const showAllowanceToast = (allowance: string) => {
    const toasterId = "1inch-allowance-check";
    toaster.pushToast({
      id: toasterId,
      title: "1Inch allowance check",
      text: `Allowance: ${allowance.substring(0, 5)}`,
      icon: "info",
      callback: () => {
        toaster.dismissToast(toasterId);
      },
    });
    setTimeout(() => toaster.dismissToast(toasterId), 2000);
  };

  const showErrorToast = (error: Error) => {
    const toasterId = "1inch-allowance-check-error";
    toaster.pushToast({
      id: toasterId,
      title: "1Inch allowance approval error",
      text: error.message,
      icon: "info",
      callback: () => {
        toaster.dismissToast(toasterId);
      },
    });
    setTimeout(() => toaster.dismissToast(toasterId), 2000);
  };

  const getTokenAllowanceApprovalSignedTx = async (swapTransaction: SwapTransactionType) => {
    const from = swapTransaction.swap.from;
    const fromAccountId = from.parentAccount?.id || from.account?.id;
    const accountQuery = getAccountId({
      accounts: signTransactionHelpers.accounts,
      accountId: fromAccountId,
    });

    if (!accountQuery.accountId) throw new Error("Invalid account id");

    // TODO: ask for allowance approve
    const approvalQuery = await queryApproveTokenAllowanceTx(swapTransaction);
    const recipient = approvalQuery.response.data.to;

    // Should be 0 (because is just an approval tx)
    const amount = new BigNumber(approvalQuery.response.data.value);
    const data = Buffer.from(approvalQuery.response.data.data.replace("0x", ""), "hex");

    swapTransaction.updateTransaction(transaction => {
      transaction.recipient = recipient;
      transaction.feesStrategy = "slow";
      transaction.amount = amount;
      (transaction as any).data = data;
      return transaction;
    });

    // const tx = {
    //   family: "ethereum",
    //   amount: amount,
    //   data,
    //   recipient,
    //   gasPrice, // Uses Gwei here?
    //   gasLimit: gasPrice,
    // }

    const signedTx = await signTransactionHelpers.signAndBroadcastTransaction({
      appId: "1inch",
      accountId: accountQuery.accountId,
      tx: swapTransaction.transaction as any,
    });
    return signedTx;
  };

  const executeAllowanceCheck = async (swapTransaction: SwapTransactionType) => {
    try {
      const allowanceCheck = await queryAllowanceCheck(swapTransaction);
      const allowance = allowanceCheck.response.data.allowance;
      const fromAmount = getFromAmount(swapTransaction);
      const positiveAllowance = new BigNumber(allowance) >= fromAmount;
      showAllowanceToast(allowance);
      if (!positiveAllowance) {
        const signedTx = await getTokenAllowanceApprovalSignedTx(swapTransaction);
        console.log("[swap] token approval tx signed", {
          tx: signedTx.txId,
          signedTx: signedTx.signedTransaction,
        });
      }
    } catch (e) {
      showErrorToast(e as Error);
    }
  };

  return {
    check: executeAllowanceCheck,
  };
};
