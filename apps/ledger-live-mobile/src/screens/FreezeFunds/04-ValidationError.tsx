import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { TrackScreen } from "LLM@analytics";
import ValidateError from "LLM@components/ValidateError";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import { FreezeNavigatorParamList } from "LLM@components/RootNavigator/types/FreezeNavigator";
import { ScreenName } from "LLM@const";
import { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<FreezeNavigatorParamList, ScreenName.FreezeValidationError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationError({ navigation, route }: NavigatorProps) {
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
      <TrackScreen category="FreezeFunds" name="ValidationError" />
      <ValidateError error={route.params.error} onRetry={retry} onClose={onClose} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
