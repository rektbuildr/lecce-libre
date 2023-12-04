import { useTheme } from "styled-components/native";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "../../../analytics";
import type { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import ValidateError from "../../../components/ValidateError";
import { ScreenName } from "../../../const";
import type { CeloUnlockFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<CeloUnlockFlowParamList, ScreenName.CeloUnlockValidationError>
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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <TrackScreen
        category="CeloUnlock"
        name="ValidationError"
        flow="stake"
        action="unlock"
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
