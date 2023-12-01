import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "LLM@analytics";
import ValidateError from "LLM@components/ValidateError";
import { ScreenName } from "LLM@const";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import type { AlgorandClaimRewardsFlowParamList } from "./type";
import { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    AlgorandClaimRewardsFlowParamList,
    ScreenName.AlgorandClaimRewardsValidationError
  >
>;

export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
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
        category="AlgorandClaimRewards"
        name="ValidationError"
        flow="stake"
        action="claim_rewards"
        currency="algo"
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
