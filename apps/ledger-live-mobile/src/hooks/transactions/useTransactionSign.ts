import BigNumber from "bignumber.js";
import { useNavigation } from "@react-navigation/core";
import { UiHook } from "@ledgerhq/live-common/wallet-api/react";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { SignedOperation } from "@ledgerhq/types-live";

import { NavigatorName, ScreenName } from "../../const";
import prepareSignTransaction from "../../components/Web3AppWebview/liveSDKLogic";
import { StackNavigatorNavigation } from "../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { useCallback } from "react";

export const useTranscationSign = (): UiHook["transaction.sign"] => {
  const navigation = useNavigation();
  const handler = useCallback(
    ({
      account,
      parentAccount,
      signFlowInfos: { liveTx },
      options,
      onSuccess,
      onError,
    }: Parameters<UiHook["transaction.sign"]>["0"]) => {
      // Prepare tx using brdige (hardware device communication - I believe)
      const tx = prepareSignTransaction(
        account,
        parentAccount,
        liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
      );
      navigation.navigate(NavigatorName.SignTransaction, {
        screen: ScreenName.SignTransactionSummary,
        params: {
          currentNavigation: ScreenName.SignTransactionSummary,
          nextNavigation: ScreenName.SignTransactionSelectDevice,
          transaction: tx as Transaction,
          accountId: account.id,
          parentId: parentAccount ? parentAccount.id : undefined,
          appName: options?.hwAppId,
          onSuccess: ({
            signedOperation,
            transactionSignError,
          }: {
            signedOperation: SignedOperation;
            transactionSignError: Error;
          }) => {
            if (transactionSignError) {
              onError(transactionSignError);
            } else {
              onSuccess(signedOperation);
              const n =
                navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() ||
                navigation;
              n.pop();
            }
          },
          onError,
        },
      });
    },
    [navigation],
  );
  return handler;
};
