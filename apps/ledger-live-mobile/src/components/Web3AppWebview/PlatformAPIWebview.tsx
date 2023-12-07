import React, { useState, useCallback, useEffect, useMemo, forwardRef } from "react";
import { useSelector } from "react-redux";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView as RNWebView, WebViewMessageEvent } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { JSONRPCRequest } from "json-rpc-2.0";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import type {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
  RawPlatformAccount,
} from "@ledgerhq/live-common/platform/rawTypes";
import { getEnv } from "@ledgerhq/live-env";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signTransactionLogic,
  completeExchangeLogic,
  signMessageLogic,
} from "@ledgerhq/live-common/platform/logic";
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import { accountToPlatformAccount } from "@ledgerhq/live-common/platform/converters";
import {
  serializePlatformAccount,
  serializePlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/serializers";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
} from "@ledgerhq/live-common/platform/react";
import BigNumber from "bignumber.js";
import { DEFAULT_MULTIBUY_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { NavigatorName, ScreenName } from "../../const";
import { broadcastSignedTx } from "../../logic/screenTransactionHooks";
import { flattenAccountsSelector } from "../../reducers/accounts";
import prepareSignTransaction from "./liveSDKLogic";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebviewState } from "./helpers";

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" />
    </View>
  );
}
export const PlatformAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, onStateChange }, ref) => {

    const { webviewProps, webviewRef } = useWebviewState(
      {
        manifest,
        inputs,
      },
      ref,
      onStateChange,
    );

    const accounts = useSelector(flattenAccountsSelector);
    const navigation =
      useNavigation<
        RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>
      >();
    const [device, setDevice] = useState<Device>();
    const listAccounts = useListPlatformAccounts(accounts);
    const listPlatformCurrencies = useListPlatformCurrencies();

    const requestAccount = useCallback(
      ({
        currencies: currencyIds,
        allowAddAccount = true,
        includeTokens,
      }: // TODO: use type RequestAccountParams from LedgerLiveApiSdk
      // }: RequestAccountParams) =>
      {
        currencies?: string[];
        allowAddAccount?: boolean;
        includeTokens?: boolean;
      }): Promise<RawPlatformAccount> =>
        new Promise((resolve, reject) => {

          /**
           * make sure currencies are strings
           * PS: yes `currencies` is properly typed as `string[]` but this typing only
           * works at build time and the `currencies` array is received at runtime from
           * JSONRPC requests. So we need to make sure the array is properly typed.
           */
          const safeCurrencyIds = currencyIds?.filter(c => typeof c === "string") ?? undefined;

          const allCurrencies = listAndFilterCurrencies({
            currencies: safeCurrencyIds,
            includeTokens,
          });
          // handle no curencies selected case
          const cryptoCurrencyIds =
            safeCurrencyIds && safeCurrencyIds.length > 0
              ? safeCurrencyIds
              : allCurrencies.map(currency => currency.id);

          const foundAccounts = cryptoCurrencyIds?.length
            ? accounts.filter(a =>
                cryptoCurrencyIds.includes(isTokenAccount(a) ? a.token.id : a.currency.id),
              )
            : accounts;

          // @TODO replace with correct error
          if (foundAccounts.length <= 0 && !allowAddAccount) {
            reject(new Error("No accounts found matching request"));
            return;
          }

          // list of queried cryptoCurrencies with one or more accounts -> used in case of not allowAddAccount and multiple accounts selectable
          const currenciesDiff = allowAddAccount
            ? cryptoCurrencyIds
            : foundAccounts
                .map(a => (isTokenAccount(a) ? a.token.id : a.currency.id))
                .filter((c, i, arr) => cryptoCurrencyIds.includes(c) && i === arr.indexOf(c));

          const onSuccess = (account: AccountLike, parentAccount?: Account) => {
            resolve(serializePlatformAccount(accountToPlatformAccount(account, parentAccount)));
          };

          const onClose = () => {
            reject(new Error("User cancelled"));
          };

          // if single currency available redirect to select account directly
          if (currenciesDiff.length === 1) {
            const currency = allCurrencies.find(c => c.id === currenciesDiff[0]);

            if (!currency) {
              // @TODO replace with correct error
              reject(new Error("Currency not found"));
              return;
            }

            navigation.navigate(NavigatorName.RequestAccount, {
              screen: ScreenName.RequestAccountsSelectAccount,
              params: {
                currencies: allCurrencies,
                currency,
                allowAddAccount,
                onSuccess,
              },
              onClose,
            });
          } else {
            navigation.navigate(NavigatorName.RequestAccount, {
              screen: ScreenName.RequestAccountsSelectCrypto,
              params: {
                currencies: allCurrencies,
                allowAddAccount,
                onSuccess,
              },
              onClose,
            });
          }
        }),
      [manifest, accounts, navigation],
    );

    const receiveOnAccount = useCallback(
      ({ accountId }: { accountId: string }) =>
        receiveOnAccountLogic(
          { manifest, accounts },
          accountId,
          (account, parentAccount, accountAddress) =>
            new Promise((resolve, reject) => {
              navigation.navigate(ScreenName.VerifyAccount, {
                account,
                parentId: parentAccount ? parentAccount.id : undefined,
                onSuccess: (_account: AccountLike) => {
                  resolve(accountAddress);
                },
                onClose: () => {
                  reject(new Error("User cancelled"));
                },
                onError: (error: Error) => {
                  // @TODO put in correct error text maybe
                  reject(error);
                },
              });
            }),
        ),
      [manifest, accounts, navigation],
    );

    const signTransaction = useCallback(
      ({
        accountId,
        transaction,
        params,
      }: // TODO: use type SignTransactionParams from LedgerLiveApiSdk
      // }: SignTransactionParams) => {
      {
        accountId: string;
        transaction: RawPlatformTransaction;
        params?: {
          /**
           * The name of the Ledger Nano app to use for the signing process
           */
          useApp: string;
        };
      }) =>
        signTransactionLogic(
          { manifest, accounts },
          accountId,
          transaction,
          (account, parentAccount, { liveTx }) => {
            const tx = prepareSignTransaction(
              account,
              parentAccount,
              liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
            );

            return new Promise((resolve, reject) => {
              navigation.navigate(NavigatorName.SignTransaction, {
                screen: ScreenName.SignTransactionSummary,
                params: {
                  currentNavigation: ScreenName.SignTransactionSummary,
                  nextNavigation: ScreenName.SignTransactionSelectDevice,
                  transaction: tx as Transaction,
                  accountId,
                  parentId: parentAccount?.id,
                  appName: params?.useApp,
                  onSuccess: ({
                    signedOperation,
                    transactionSignError,
                  }: {
                    signedOperation: SignedOperation;
                    transactionSignError: Error;
                  }) => {
                    if (transactionSignError) {
                      reject(transactionSignError);
                    } else {
                      resolve(serializePlatformSignedTransaction(signedOperation));
                      const n =
                        navigation.getParent<
                          StackNavigatorNavigation<BaseNavigatorStackParamList>
                        >() || navigation;
                      n.pop();
                    }
                  },
                  onError: (error: Error) => {
                    reject(error);
                  },
                },
              });
            });
          },
        ),
      [manifest, accounts, navigation],
    );

    const broadcastTransaction = useCallback(
      ({
        accountId,
        signedTransaction,
      }: {
        accountId: string;
        signedTransaction: RawPlatformSignedTransaction;
      }) =>
        broadcastTransactionLogic(
          { manifest, accounts },
          accountId,
          signedTransaction,
          async (account, parentAccount, signedOperation) => {
            let optimisticOperation: Operation = signedOperation.operation;

            if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
              try {
                optimisticOperation = await broadcastSignedTx(
                  account,
                  parentAccount,
                  signedOperation,
                );
              } catch (error) {
                throw error;
              }
            }

            return optimisticOperation.hash;
          },
        ),
      [manifest, accounts],
    );

    const startExchange = useCallback(
      ({ exchangeType }: { exchangeType: number }) => {

        return new Promise((resolve, reject) => {
          navigation.navigate(NavigatorName.PlatformExchange, {
            screen: ScreenName.PlatformStartExchange,
            params: {
              request: {
                exchangeType,
              },
              onResult: (result: {
                startExchangeResult?: string;
                startExchangeError?: Error;
                device?: Device;
              }) => {
                if (result.startExchangeError) {
                  reject(result.startExchangeError);
                }

                if (result.startExchangeResult) {
                  setDevice(result.device);
                  resolve(result.startExchangeResult);
                }

                const n =
                  navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() ||
                  navigation;
                n.pop();
              },
            },
          });
        });
      },
      [manifest, navigation],
    );

    const completeExchange = useCallback(
      (request: {
        provider: string;
        fromAccountId: string;
        toAccountId: string;
        transaction: RawPlatformTransaction;
        binaryPayload: string;
        signature: string;
        feesStrategy: string;
        exchangeType: number;
        amountExpectedTo?: number;
      }) =>
        completeExchangeLogic(
          { manifest, accounts },
          request,
          ({
            provider,
            exchange,
            transaction,
            binaryPayload,
            signature,
            feesStrategy,
            exchangeType,
          }): Promise<Operation> =>
            new Promise((resolve, reject) => {
              navigation.navigate(NavigatorName.PlatformExchange, {
                screen: ScreenName.PlatformCompleteExchange,
                params: {
                  request: {
                    exchangeType,
                    provider,
                    exchange,
                    transaction: transaction as Transaction,
                    binaryPayload,
                    signature,
                    feesStrategy,
                  },
                  device,
                  onResult: (result: { operation?: Operation; error?: Error }) => {
                    if (result.error) {
                      reject(result.error);
                    }
                    if (result.operation) {
                      resolve(result.operation);
                    }
                    setDevice(undefined);
                    const n =
                      navigation.getParent<
                        StackNavigatorNavigation<BaseNavigatorStackParamList>
                      >() || navigation;
                    n.pop();
                  },
                },
              });
            }),
        ),
      [accounts, manifest, navigation, device],
    );

    const signMessage = useCallback(
      ({ accountId, message }: { accountId: string; message: string }) =>
        signMessageLogic(
          { manifest, accounts },
          accountId,
          message,
          ({ id: accountId }, message) =>
            new Promise((resolve, reject) => {
              navigation.navigate(NavigatorName.SignMessage, {
                screen: ScreenName.SignSummary,
                params: {
                  message,
                  accountId,
                  onConfirmationHandler: (message: string) => {
                    resolve(message);
                  },
                  onFailHandler: (error: Error) => {
                    reject(error);
                  },
                },
                onClose: () => {
                  reject(new UserRefusedOnDevice());
                },
              });
            }),
        ),
      [accounts, manifest, navigation],
    );

    const handlers = useMemo(
      () => ({
        "account.list": listAccounts,
        "currency.list": listPlatformCurrencies,
        "account.request": requestAccount,
        "account.receive": receiveOnAccount,
        "transaction.sign": signTransaction,
        "transaction.broadcast": broadcastTransaction,
        "exchange.start": startExchange,
        "exchange.complete": completeExchange,
        "message.sign": signMessage,
      }),
      [
        listAccounts,
        listPlatformCurrencies,
        requestAccount,
        receiveOnAccount,
        signTransaction,
        broadcastTransaction,
        startExchange,
        completeExchange,
        signMessage,
      ],
    );
    const handleSend = useCallback(
      (request: JSONRPCRequest): Promise<void> => {
        const webview = safeGetRefValue(webviewRef);
        webview.postMessage(JSON.stringify(request));

        return Promise.resolve();
      },
      [webviewRef],
    );
    const [receive] = useJSONRPCServer(handlers, handleSend);
    const handleMessage = useCallback(
      (e: WebViewMessageEvent) => {
        // FIXME: event isn't the same on desktop & mobile
        // if (e.isTrusted && e.origin === manifest.url.origin && e.data) {
        if (e.nativeEvent?.data) {
          receive(JSON.parse(e.nativeEvent.data));
        }
      },
      [receive],
    );

    const handleError = useCallback(() => {
    }, [manifest]);

    useEffect(() => {
    }, [manifest]);

    const javaScriptCanOpenWindowsAutomatically = manifest.id === DEFAULT_MULTIBUY_APP_ID;

    return (
      <RNWebView
        ref={webviewRef}
        allowsBackForwardNavigationGestures
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        onMessage={handleMessage}
        onError={handleError}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
        javaScriptCanOpenWindowsAutomatically={javaScriptCanOpenWindowsAutomatically}
        {...webviewProps}
      />
    );
  },
);

PlatformAPIWebview.displayName = "PlatformAPIWebview";

const styles = StyleSheet.create({
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
