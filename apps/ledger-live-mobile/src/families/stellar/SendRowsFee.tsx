import React from "react";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CompositeScreenProps } from "@react-navigation/native";
import StellarFeeRow from "./StellarFeeRow";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "LLM@const";
import { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "LLM@components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  transaction: Transaction;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function StellarSendRowsFee({ account, ...props }: Props) {
  return <StellarFeeRow {...props} account={account} />;
}
