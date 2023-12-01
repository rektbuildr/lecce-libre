import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import type { Transaction as TronTransaction } from "@ledgerhq/live-common/families/tron/types";
import { accountScreenSelector } from "LLM@reducers/accounts";
import { TrackScreen } from "LLM@analytics";
import { ScreenName } from "LLM@const";
import PreventNativeBack from "LLM@components/PreventNativeBack";
import ValidateSuccess from "LLM@components/ValidateSuccess";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "LLM@components/RootNavigator/types/helpers";
import { UnfreezeNavigatorParamList } from "LLM@components/RootNavigator/types/UnfreezeNavigator";
import { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";

type Props = CompositeScreenProps<
  StackNavigatorProps<UnfreezeNavigatorParamList, ScreenName.UnfreezeValidationSuccess>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const transaction = route.params.transaction;
  const resource = (transaction as TronTransaction).resource || "";
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [navigation, account, route.params.result]);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="UnfreezeFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="unfreeze.validation.success" />}
        description={
          <Trans
            i18nKey="unfreeze.validation.info"
            values={{
              resource: resource.toLowerCase(),
            }}
          />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
