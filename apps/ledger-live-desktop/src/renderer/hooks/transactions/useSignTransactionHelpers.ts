import { signTransactionLogic } from "@ledgerhq/live-common/platform/logic";

import trackingWrapper from "@ledgerhq/live-common/platform/tracking";

import { track } from "~/renderer/analytics/segment";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useDispatch, useSelector } from "react-redux";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { SignedOperation } from "@ledgerhq/types-live";
import {
  RawPlatformSignedTransaction,
  RawPlatformTransaction,
} from "@ledgerhq/live-common/platform/rawTypes";
import { openModal } from "~/renderer/actions/modals";
import { serializePlatformSignedTransaction } from "@ledgerhq/live-common/platform/serializers";
import { broadcastTransactionLogic } from "~/renderer/components/Web3AppWebview/LiveAppSDKLogic";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { useTranslation } from "react-i18next";

const tracking = trackingWrapper(track);

type SignTransactionParams = {
  appId?: string;
  accountId: string;
  tx: RawPlatformTransaction;
};

export const useSignTransactionHelpers = (appId: string) => {
  const toaster = useToasts();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || remoteManifest;

  const broadcastTransaction = async ({
    accountId,
    signedTransaction,
  }: {
    accountId: string;
    signedTransaction: RawPlatformSignedTransaction;
  }) => {
    if (!manifest) throw new Error("Missing manifest");
    return broadcastTransactionLogic(
      { manifest, dispatch, accounts },
      accountId,
      signedTransaction,
      toaster.pushToast,
      t,
    );
  };

  const signTransaction = async (args: SignTransactionParams) => {
    if (!manifest) throw new Error("Missing manifest");
    return await signTransactionLogic(
      {
        manifest,
        accounts,
        tracking,
      },
      args.accountId,
      args.tx,
      (account, parentAccount, { canEditFees, hasFeesProvided, liveTx }) => {
        return new Promise((resolve, reject) =>
          dispatch(
            openModal("MODAL_SIGN_TRANSACTION", {
              canEditFees,
              stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
              transactionData: liveTx,
              useApp: args.appId,
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
  };

  const signAndBroadcastTransaction = async (args: SignTransactionParams) => {
    const signedTransaction = await signTransaction(args);
    const txId = await broadcastTransaction({
      accountId: args.accountId,
      signedTransaction,
    });
    return {
      txId,
      signedTransaction,
    };
  };

  return { accounts, signTransaction, signAndBroadcastTransaction };
};

export const use1InchSignTransactionHelpers = () => useSignTransactionHelpers("1inch");
