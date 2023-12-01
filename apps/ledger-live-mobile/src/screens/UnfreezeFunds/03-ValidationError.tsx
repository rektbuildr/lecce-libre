import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "LLM@analytics";
import ValidateError from "LLM@components/ValidateError";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import type { UnfreezeNavigatorParamList } from "LLM@components/RootNavigator/types/UnfreezeNavigator";
import { ScreenName } from "LLM@const";
import { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type Props = CompositeScreenProps<
  StackNavigatorProps<UnfreezeNavigatorParamList, ScreenName.UnfreezeValidationError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;
export default function ValidationError({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="UnfreezeFunds" name="ValidationError" />
      <ValidateError error={route.params.error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
