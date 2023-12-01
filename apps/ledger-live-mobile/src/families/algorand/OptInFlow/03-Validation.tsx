import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import { useSignWithDevice } from "LLM@logic/screenTransactionHooks";
import { updateAccountWithUpdater } from "LLM@actions/accounts";
import { accountScreenSelector } from "LLM@reducers/accounts";
import { TrackScreen } from "LLM@analytics";
import PreventNativeBack from "LLM@components/PreventNativeBack";
import ValidateOnDevice from "LLM@components/ValidateOnDevice";
import SkipLock from "LLM@components/behaviour/SkipLock";
import { ScreenName } from "LLM@const";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { AlgorandOptInFlowParamList } from "./types";

type Props = StackNavigatorProps<AlgorandOptInFlowParamList, ScreenName.AlgorandOptInSummary>;
export default function Validation({ route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const dispatch = useDispatch();
  const [signing, signed] = useSignWithDevice({
    context: "AlgorandOptIn",
    account,
    parentAccount: undefined,
    updateAccountWithUpdater: (accountId: string, updater: (account: Account) => Account) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
  });
  const { status, transaction, modelId, wired, deviceId } = route.params;
  const device = useMemo(
    () => ({
      deviceId,
      modelId,
      wired,
    }),
    [modelId, wired, deviceId],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="AlgorandOptIn" name="Validation" signed={signed} />
      {signing && (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}

      {signed ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ValidateOnDevice
          device={device}
          account={account}
          parentAccount={undefined}
          status={status}
          transaction={transaction}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
