import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { Account } from "@ledgerhq/types-live";

import { shallowAccountsSelector } from "../../reducers/accounts";
import { useTranscationSign } from "./useTransactionSign";

type OnSwapProps = {
  swapTransaction: SwapTransactionType;
};

export const useSwapTransactionHelper = () => {
  const accounts = useSelector(shallowAccountsSelector);
  const transactionSign = useTranscationSign();

  /**
   * Tx.options (indicate hardapp firmware app to use?)
   * - when used with `prepareSignTransaction` it should communicate with hardware device, indicating 1inch app should be use
   * Tx.amount dictates what is shown on LLM UI for confirmation
   * Tx.data buffer dictates what will be shown on the ledger nano device
   * - (creates buffer object from 0x.... string value including 0x and use hex as decode option)
   *
   * TODO: Not sure how to get recipient address
   * TODO: Unable to test amount permission access / approval flow (piror to tx signing)
   *  - "account.request" rpc hook from LLM/Web3AppWebView/helpers/useUiHook fn (maybe?)
   *  - requestAccount from LLM/Web3AppWebView/PlatformAPIWebview/requestAccount fn (maybe?)
   */
  const onSwap = ({ swapTransaction }: OnSwapProps) => {
    const from = swapTransaction.swap.from;
    const fromAccountId = from.parentAccount?.id || from.account?.id;
    const { account, accountId, parentAccount } = getAccountId({
      accounts,
      accountId: fromAccountId,
    });

    if (!accountId) throw new Error("Missing account id");
    if (!account) throw new Error("Missing account");

    transactionSign({
      account,
      parentAccount,
      signFlowInfos: {
        canEditFees: false,
        hasFeesProvided: true,
        liveTx: {
          recipient: "0x1111111254EEB25477B68fb85Ed929f73A960582",
          /**
           * This should be from our backend API using 1inch's API for tx data buffer to use for signing targeting their contract
           * 
           * Test buffer data is different from one used on desktop app
           * Desktop tx buffer has slippage (%) set to 25 (e.g slow, medium, fast & custom?) and fee (set to 3)
           */
          data: Buffer.from(
            "12aa3caf0000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f00000000000000000000000008c156379dcfe7611c34b14b80ca747287cf6a3740000000000000000000000000000000000000000000000000058d15e176280000000000000000000000000000000000000000000000000000000000001c714d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011b0000000000000000000000000000000000000000fd00006e00005400004e802026678dcd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002aa1efb94e00000206b4be0b94041c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2d0e30db00c20c02aaa39b223fe8d0a0e5c4f27ead9083c756cc23aa370aacf4cb08c7e1e7aa8e8ff9418d73c7e0f6ae4071138002dc6c03aa370aacf4cb08c7e1e7aa8e8ff9418d73c7e0f1111111254eeb25477b68fb85ed929f73a9605820000000000000000000000000000000000000000000000000000000001c714d4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000008b1ccac8",
            "hex",
          ),
        },
      },
      options: {
        hwAppId: "1inch",
      },
      onSuccess: () => {
        Alert.alert("[Swap] Tx signed!! 🎉");
      },
      onError: e => {
        Alert.alert("nav on sign error", e.message);
      },
    });
  };
  return onSwap;
};

type GetAccountIdProps = {
  accounts: Account[];
  accountId?: string;
};

/**
 * Helper extracted from LLM/Screens/Swap/Form/index.tsx onSubmit function
 * (Removed wallet api related logic e.g Wallet api partner list check, wallet api id retrieval)
 *
 * @param {Account[]} List of accounts (from redux)
 * @param {string} Account id
 * @returns {
 *  Account,
 *  AccountId
 *  ParentAccount
 * }
 */
const getAccountId = ({ accounts, accountId }: GetAccountIdProps) => {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return { accountId };
  const parentAccount = isTokenAccount(account) ? getParentAccount(account, accounts) : undefined;
  return {
    account,
    accountId,
    parentAccount,
  };
};
