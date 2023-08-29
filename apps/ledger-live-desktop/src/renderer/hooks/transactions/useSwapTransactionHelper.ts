import { useDispatch, useSelector } from "react-redux";
import { Account, SignedOperation } from "@ledgerhq/types-live";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { signTransactionLogic } from "@ledgerhq/live-common/platform/logic";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { serializePlatformSignedTransaction } from "@ledgerhq/live-common/platform/serializers";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

import { openModal } from "~/renderer/actions/modals";
import { track } from "~/renderer/analytics/segment";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";

const tracking = trackingWrapper(track);

type OnSwapProps = {
  swapTransaction: SwapTransactionType;
};

export const useSwapTransactionHelper = () => {
  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);

  const appId = "1inch";
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || remoteManifest;

  const onSwap = async ({ swapTransaction }: OnSwapProps) => {
    const from = swapTransaction.swap.from;
    const fromAccountId = from.parentAccount?.id || from.account?.id;
    const { account, accountId } = getAccountId({
      accounts,
      accountId: fromAccountId,
    });

    if (!manifest) throw new Error("Missing manifest");
    if (!accountId) throw new Error("Missing account id");
    if (!account) throw new Error("Missing account");
    if (!swapTransaction.transaction) throw new Error("Invalid transaction object");

    /**
     * signTransactionLogic expect transaction's (RawPlatformTransaction) amount to be a string
     * However I'm not sure this is correct, should be a BigNumber I think
     *
     * TODO: Fix typing
     */
    const tx: any = {
      ...swapTransaction.transaction,
      recipient: "0x1111111254EEB25477B68fb85Ed929f73A960582",
      /**
       * Test buffer data is different from one used on mobile app
       * Desktop tx buffer has slippage (%) set to 2 (e.g slow, medium, fast & custom?) and fee (set to 0)
       */
      data: Buffer.from(
        "0x0502b1c500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000058d15e1762800000000000000000000000000000000000000000000000000000000000028166c30000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000180000000000000003b6d0340397ff1542f962076d0bfe58ea045ffa2d347aca08b1ccac8",
        "hex",
      ),
    };

    try {
      const signedTx = await signTransactionLogic(
        {
          manifest,
          accounts,
          tracking,
        },
        accountId,
        tx,
        (account, parentAccount, { canEditFees, hasFeesProvided, liveTx }) => {
          return new Promise((resolve, reject) =>
            dispatch(
              openModal("MODAL_SIGN_TRANSACTION", {
                canEditFees,
                stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
                transactionData: liveTx,
                useApp: appId,
                account,
                parentAccount,
                onResult: (signedOperation: SignedOperation) => {
                  tracking.platformSignTransactionSuccess(manifest);
                  resolve(serializePlatformSignedTransaction(signedOperation));
                },
                onCancel: (error: Error) => {
                  tracking.platformSignTransactionFail(manifest);
                  reject(error);
                },
              }),
            ),
          );
        },
      );
      console.log("[swap] tx signed", signedTx);
    } catch (e) {
      console.log("[swap] tx sign error", e);
    }
  };
  return onSwap;
};

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
const getAccountId = ({ accounts, accountId }: GetAccountIdProps) => {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return { accountId };
  const parentAccount = isTokenAccount(account) ? getParentAccount(account, accounts) : undefined;
  return {
    account,
    accountId,
    parentAccount,
  };
};
