import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountScreenSelector } from "LLM@reducers/accounts";
import { TrackScreen } from "LLM@analytics";
import ValidateError from "LLM@components/ValidateError";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { CosmosClaimRewardsFlowParamList } from "./types";
import { ScreenName } from "LLM@const";

type Props = BaseComposite<
  StackNavigatorProps<CosmosClaimRewardsFlowParamList, ScreenName.CosmosClaimRewardsValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const error = route.params.error;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="CosmosClaimRewards"
        name="ValidationError"
        flow="stake"
        action="claim_rewards"
        currency={ticker}
      />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
