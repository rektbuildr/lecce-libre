import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "LLM@reducers/accounts";
import { TrackScreen } from "LLM@analytics";
import { ScreenName } from "LLM@const";
import PreventNativeBack from "LLM@components/PreventNativeBack";
import ValidateSuccess from "LLM@components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import type { CeloRegistrationFlowParamList } from "./types";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<CeloRegistrationFlowParamList, ScreenName.CeloRegistrationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;

    const result = route.params?.result;
    if (!result) return;

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="CeloRegistrationFlow"
        name="ValidationSuccess"
        flow="stake"
        action="registration"
        currency="celo"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="celo.register.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="celo.register.flow.steps.verification.success.text" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
