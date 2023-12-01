import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "LLM@analytics";
import { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import ValidateError from "LLM@components/ValidateError";
import { ScreenName } from "LLM@const";
import type { CeloActivateFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<CeloActivateFlowParamList, ScreenName.CeloActivateValidationError>
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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="CeloActivate"
        name="ValidationError"
        flow="stake"
        action="activate"
        currency="celo"
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
