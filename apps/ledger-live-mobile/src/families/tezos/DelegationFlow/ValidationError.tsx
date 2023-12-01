import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import ValidateError from "LLM@components/ValidateError";
import { TrackScreen } from "LLM@analytics";
import { ScreenName } from "LLM@const";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import type { TezosDelegationFlowParamList } from "./types";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.DelegationValidationError>
>;
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const error = route.params?.error;
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
        category="DelegationFlow"
        name="ValidationError"
        flow="stake"
        action="delegation"
        currency="xtz"
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
