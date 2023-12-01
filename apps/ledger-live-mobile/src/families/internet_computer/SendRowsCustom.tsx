import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import SendRowMemo from "./SendRowMemo";
import { BaseComposite, StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "LLM@components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "LLM@components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "LLM@components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "LLM@const";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  transaction: Transaction;
  account: Account;
} & Navigation;
export default function InternetComputerSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return (
    <>
      <SendRowMemo {...rest} transaction={transaction as ICPTransaction} />
    </>
  );
}
