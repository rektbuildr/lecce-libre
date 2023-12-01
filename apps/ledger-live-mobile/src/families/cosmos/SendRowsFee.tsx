import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import SummaryRow from "LLM@screens/SendFunds/SummaryRow";
import LText from "LLM@components/LText";
import CurrencyUnitValue from "LLM@components/CurrencyUnitValue";
import CounterValue from "LLM@components/CounterValue";
import ExternalLink from "LLM@icons/ExternalLink";
import { urls } from "LLM@utils/urls";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "LLM@const";
import type { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "LLM@components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function CosmosFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);
  const fees = (transaction as CosmosTransaction).fees;
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);
  return (
    <SummaryRow
      onPress={extraInfoFees}
      title={<Trans i18nKey="send.fees.title" />}
      additionalInfo={
        <View>
          <ExternalLink size={12} color={colors.grey} />
        </View>
      }
    >
      <View
        style={{
          alignItems: "flex-end",
        }}
      >
        <View style={styles.accountContainer}>
          {fees ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue} color="grey">
          {fees ? <CounterValue before="≈ " value={fees} currency={currency} /> : null}
        </LText>
      </View>
    </SummaryRow>
  );
}
const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
});
