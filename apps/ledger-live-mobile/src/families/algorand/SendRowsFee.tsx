import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction as AlgorandTransaction } from "@ledgerhq/live-common/families/algorand/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import SummaryRow from "LLM@screens/SendFunds/SummaryRow";
import LText from "LLM@components/LText";
import CurrencyUnitValue from "LLM@components/CurrencyUnitValue";
import CounterValue from "LLM@components/CounterValue";
import ExternalLink from "LLM@icons/ExternalLink";
import { urls } from "LLM@utils/urls";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "LLM@const";
import type { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "LLM@components/RootNavigator/types/SwapNavigator";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function AlgorandFeeRow({ account, parentAccount, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);
  const fees = (transaction as AlgorandTransaction).fees;
  const mainAccount = getMainAccount(account, parentAccount);
  const unit = getAccountUnit(mainAccount);
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
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
});
