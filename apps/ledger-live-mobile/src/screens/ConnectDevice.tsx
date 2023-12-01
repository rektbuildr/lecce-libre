import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTheme } from "styled-components/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { accountScreenSelector } from "LLM@reducers/accounts";
import DeviceAction from "LLM@components/DeviceAction";
import { renderLoading } from "LLM@components/DeviceAction/rendering";
import { useSignedTxHandler } from "LLM@logic/screenTransactionHooks";
import { TrackScreen } from "LLM@analytics";
import type { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "LLM@const";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { ClaimRewardsNavigatorParamList } from "LLM@components/RootNavigator/types/ClaimRewardsNavigator";
import type { FreezeNavigatorParamList } from "LLM@components/RootNavigator/types/FreezeNavigator";
import type { UnfreezeNavigatorParamList } from "LLM@components/RootNavigator/types/UnfreezeNavigator";
import type { PolkadotSimpleOperationFlowParamList } from "LLM@families/polkadot/SimpleOperationFlow/types";
import type { PolkadotNominateFlowParamList } from "LLM@families/polkadot/NominateFlow/types";
import type { PolkadotUnbondFlowParamList } from "LLM@families/polkadot/UnbondFlow/type";
import type { PolkadotRebondFlowParamList } from "LLM@families/polkadot/RebondFlow/type";
import type { PolkadotBondFlowParamList } from "LLM@families/polkadot/BondFlow/types";
import type { AlgorandClaimRewardsFlowParamList } from "LLM@families/algorand/Rewards/ClaimRewardsFlow/type";
import type { AlgorandOptInFlowParamList } from "LLM@families/algorand/OptInFlow/types";
import type { CardanoDelegationFlowParamList } from "LLM@families/cardano/DelegationFlow/types";
import type { CardanoUndelegationFlowParamList } from "LLM@families/cardano/UndelegationFlow/types";
import type { CeloWithdrawFlowParamList } from "LLM@families/celo/WithdrawFlow/types";
import type { CeloRevokeFlowFlowParamList } from "LLM@families/celo/RevokeFlow/types";
import type { CeloActivateFlowParamList } from "LLM@families/celo/ActivateFlow/types";
import type { CeloVoteFlowParamList } from "LLM@families/celo/VoteFlow/types";
import type { CeloUnlockFlowParamList } from "LLM@families/celo/UnlockFlow/types";
import type { CeloLockFlowParamList } from "LLM@families/celo/LockFlow/types";
import type { CeloRegistrationFlowParamList } from "LLM@families/celo/RegistrationFlow/types";
import type { CosmosDelegationFlowParamList } from "LLM@families/cosmos/DelegationFlow/types";
import type { CosmosRedelegationFlowParamList } from "LLM@families/cosmos/RedelegationFlow/types";
import type { CosmosUndelegationFlowParamList } from "LLM@families/cosmos/UndelegationFlow/types";
import type { CosmosClaimRewardsFlowParamList } from "LLM@families/cosmos/ClaimRewardsFlow/types";
import type { ElrondDelegationFlowParamList } from "LLM@families/elrond/components/Flows/Delegate/types";
import type { ElrondUndelegationFlowParamList } from "LLM@families/elrond/components/Flows/Undelegate/types";
import type { ElrondClaimRewardsFlowParamList } from "LLM@families/elrond/components/Flows/Claim/types";
import type { ElrondWithdrawFlowParamList } from "LLM@families/elrond/components/Flows/Withdraw/types";
import type { NearStakingFlowParamList } from "LLM@families/near/StakingFlow/types";
import type { NearUnstakingFlowParamList } from "LLM@families/near/UnstakingFlow/types";
import type { NearWithdrawingFlowParamList } from "LLM@families/near/WithdrawingFlow/types";
import { SolanaDelegationFlowParamList } from "LLM@families/solana/DelegationFlow/types";
import { StellarAddAssetFlowParamList } from "LLM@families/stellar/AddAssetFlow/types";
import { TezosDelegationFlowParamList } from "LLM@families/tezos/DelegationFlow/types";
import { TronVoteFlowParamList } from "LLM@families/tron/VoteFlow/types";
import { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import { SignMessageNavigatorStackParamList } from "LLM@components/RootNavigator/types/SignMessageNavigator";
import { useTransactionDeviceAction } from "LLM@hooks/deviceActions";
import { SignedOperation } from "@ledgerhq/types-live";

type Props =
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendConnectDevice>
  | StackNavigatorProps<ClaimRewardsNavigatorParamList, ScreenName.ClaimRewardsConnectDevice>
  | StackNavigatorProps<FreezeNavigatorParamList, ScreenName.FreezeConnectDevice>
  | StackNavigatorProps<UnfreezeNavigatorParamList, ScreenName.UnfreezeConnectDevice>
  | StackNavigatorProps<
      PolkadotSimpleOperationFlowParamList,
      ScreenName.PolkadotSimpleOperationConnectDevice
    >
  | StackNavigatorProps<PolkadotNominateFlowParamList, ScreenName.PolkadotNominateConnectDevice>
  | StackNavigatorProps<PolkadotUnbondFlowParamList, ScreenName.PolkadotUnbondConnectDevice>
  | StackNavigatorProps<PolkadotRebondFlowParamList, ScreenName.PolkadotRebondConnectDevice>
  | StackNavigatorProps<PolkadotBondFlowParamList, ScreenName.PolkadotBondConnectDevice>
  | StackNavigatorProps<
      AlgorandClaimRewardsFlowParamList,
      ScreenName.AlgorandClaimRewardsConnectDevice
    >
  | StackNavigatorProps<CardanoDelegationFlowParamList, ScreenName.CardanoDelegationConnectDevice>
  | StackNavigatorProps<
      CardanoUndelegationFlowParamList,
      ScreenName.CardanoUndelegationConnectDevice
    >
  | StackNavigatorProps<AlgorandOptInFlowParamList, ScreenName.AlgorandOptInConnectDevice>
  | StackNavigatorProps<CeloWithdrawFlowParamList, ScreenName.CeloWithdrawConnectDevice>
  | StackNavigatorProps<CeloRevokeFlowFlowParamList, ScreenName.CeloRevokeConnectDevice>
  | StackNavigatorProps<CeloActivateFlowParamList, ScreenName.CeloActivateConnectDevice>
  | StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteConnectDevice>
  | StackNavigatorProps<CeloUnlockFlowParamList, ScreenName.CeloUnlockConnectDevice>
  | StackNavigatorProps<CeloLockFlowParamList, ScreenName.CeloLockConnectDevice>
  | StackNavigatorProps<CeloRegistrationFlowParamList, ScreenName.CeloRegistrationConnectDevice>
  | StackNavigatorProps<CosmosDelegationFlowParamList, ScreenName.CosmosDelegationConnectDevice>
  | StackNavigatorProps<CosmosRedelegationFlowParamList, ScreenName.CosmosRedelegationConnectDevice>
  | StackNavigatorProps<CosmosUndelegationFlowParamList, ScreenName.CosmosUndelegationConnectDevice>
  | StackNavigatorProps<CosmosClaimRewardsFlowParamList, ScreenName.CosmosClaimRewardsConnectDevice>
  | StackNavigatorProps<ElrondDelegationFlowParamList, ScreenName.ElrondDelegationConnectDevice>
  | StackNavigatorProps<ElrondUndelegationFlowParamList, ScreenName.ElrondUndelegationConnectDevice>
  | StackNavigatorProps<ElrondClaimRewardsFlowParamList, ScreenName.ElrondClaimRewardsConnectDevice>
  | StackNavigatorProps<ElrondWithdrawFlowParamList, ScreenName.ElrondWithdrawConnectDevice>
  | StackNavigatorProps<NearStakingFlowParamList, ScreenName.NearStakingConnectDevice>
  | StackNavigatorProps<NearUnstakingFlowParamList, ScreenName.NearUnstakingConnectDevice>
  | StackNavigatorProps<NearWithdrawingFlowParamList, ScreenName.NearWithdrawingConnectDevice>
  | StackNavigatorProps<SolanaDelegationFlowParamList, ScreenName.DelegationConnectDevice>
  | StackNavigatorProps<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetConnectDevice>
  | StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.DelegationConnectDevice>
  | StackNavigatorProps<TronVoteFlowParamList, ScreenName.VoteConnectDevice>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionConnectDevice>
  | StackNavigatorProps<SignMessageNavigatorStackParamList, ScreenName.SignConnectDevice>;

export const navigateToSelectDevice = (navigation: Props["navigation"], route: Props["route"]) =>
  // Assumes that it will always navigate to a "SelectDevice"
  // type of component accepting mostly the same params as this one.
  (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(
    route.name.replace("ConnectDevice", "SelectDevice"),
    {
      ...route.params,
      forceSelectDevice: true,
    },
  );
export default function ConnectDevice({ route, navigation }: Props) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const { appName, onSuccess, onError, analyticsPropertyFlow } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const handleTx = useSignedTxHandler({
    account,
    parentAccount,
  });
  const onResult = useCallback(
    (payload: { signedOperation: SignedOperation; transactionSignError?: Error }) => {
      handleTx(payload);
      return renderLoading({
        t,
      });
    },
    [handleTx, t],
  );
  const extraProps = onSuccess
    ? {
        onResult: onSuccess,
        onError,
      }
    : {
        renderOnResult: onResult,
      };
  return useMemo(
    () =>
      transaction ? (
        <SafeAreaView
          edges={edges}
          style={[
            styles.root,
            {
              backgroundColor: colors.background.main,
            },
          ]}
        >
          <TrackScreen category={route.name.replace("ConnectDevice", "")} name="ConnectDevice" />
          <DeviceAction
            // @ts-expect-error what is going on with this
            action={action}
            request={{
              account,
              parentAccount,
              appName,
              transaction,
              status,
              tokenCurrency,
            }}
            device={route.params.device}
            onSelectDeviceLink={() => navigateToSelectDevice(navigation, route)}
            {...extraProps}
            analyticsPropertyFlow={analyticsPropertyFlow}
          />
        </SafeAreaView>
      ) : null, // prevent rerendering caused by optimistic update (i.e. exclude account related deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, transaction, tokenCurrency, route.params.device],
  );
}

const edges = ["bottom"] as Edge[];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
