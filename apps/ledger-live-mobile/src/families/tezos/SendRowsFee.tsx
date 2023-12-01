import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { CompositeScreenProps } from "@react-navigation/native";
import TezosFeeRow from "./TezosFeeRow";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "LLM@const";
import { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "LLM@components/RootNavigator/types/SwapNavigator";

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

export default function TezosSendRowsFee({ account, ...props }: Props) {
  return <TezosFeeRow {...props} account={account} />;
}
