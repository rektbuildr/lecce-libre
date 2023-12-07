import { useMemo, useState, useEffect, useRef, useCallback, RefObject } from "react";
import semver from "semver";
import { formatDistanceToNow } from "date-fns";
import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  WalletHandlers,
  useWalletAPIServer as useWalletAPIServerRaw,
  ServerConfig,
} from "@ledgerhq/wallet-api-server";
import {
  ServerError,
  createCurrencyNotFound,
  Transport,
  Permission,
} from "@ledgerhq/wallet-api-core";
import { StateDB } from "../hooks/useDBRaw";
import { Observable, firstValueFrom, Subject } from "rxjs";
import { first } from "rxjs/operators";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  getAccountIdFromWalletAccountId,
} from "./converters";
import { isWalletAPISupportedCurrency } from "./helpers";
import { WalletAPICurrency, AppManifest, WalletAPIAccount, WalletAPICustomHandlers } from "./types";
import { getMainAccount, getParentAccount } from "../account";
import { listCurrencies, findCryptoCurrencyById, findTokenById } from "../currencies";
import {
  bitcoinFamillyAccountGetXPubLogic,
  broadcastTransactionLogic,
  startExchangeLogic,
  completeExchangeLogic,
  CompleteExchangeRequest,
  CompleteExchangeUiRequest,
  receiveOnAccountLogic,
  signMessageLogic,
  signTransactionLogic,
} from "./logic";
import { getAccountBridge } from "../bridge";
import { getEnv } from "@ledgerhq/live-env";
import openTransportAsSubject, { BidirectionalEvent } from "../hw/openTransportAsSubject";
import { AppResult } from "../hw/actions/app";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Transaction } from "../generated/types";
import { useManifests } from "../platform/providers/RemoteLiveAppProvider";
import { DISCOVER_INITIAL_CATEGORY, MAX_RECENTLY_USED_LENGTH } from "./constants";
import { DiscoverDB } from "./types";

export function safeGetRefValue<T>(ref: RefObject<T>): T {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}

export function useWalletAPIAccounts(accounts: AccountLike[]): WalletAPIAccount[] {
  return useMemo(() => {
    return accounts.map(account => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToWalletAPIAccount(account, parentAccount);
    });
  }, [accounts]);
}

export function useWalletAPICurrencies(): WalletAPICurrency[] {
  return useMemo(() => {
    return listCurrencies(true).reduce<WalletAPICurrency[]>((filtered, currency) => {
      if (isWalletAPISupportedCurrency(currency)) {
        filtered.push(currencyToWalletAPICurrency(currency));
      }
      return filtered;
    }, []);
  }, []);
}

export function useGetAccountIds(
  accounts$: Observable<WalletAPIAccount[]> | undefined,
): Map<string, boolean> | undefined {
  const [accounts, setAccounts] = useState<WalletAPIAccount[]>([]);

  useEffect(() => {
    if (!accounts$) {
      return undefined;
    }

    const subscription = accounts$.subscribe(walletAccounts => {
      setAccounts(walletAccounts);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [accounts$]);

  return useMemo(() => {
    if (!accounts$) {
      return undefined;
    }

    return accounts.reduce((accountIds, account) => {
      accountIds.set(getAccountIdFromWalletAccountId(account.id), true);
      return accountIds;
    }, new Map());
  }, [accounts, accounts$]);
}

export interface UiHook {
  "account.request": (params: {
    accounts$: Observable<WalletAPIAccount[]>;
    currencies: CryptoOrTokenCurrency[];
    onSuccess: (account: AccountLike, parentAccount: Account | undefined) => void;
    onCancel: () => void;
  }) => void;
  "account.receive": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    accountAddress: string;
    onSuccess: (address: string) => void;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => void;
  "message.sign": (params: {
    account: AccountLike;
    message: AnyMessage;
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "storage.get": WalletHandlers["storage.get"];
  "storage.set": WalletHandlers["storage.set"];
  "transaction.sign": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    };
    options: Parameters<WalletHandlers["transaction.sign"]>[0]["options"];
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "transaction.broadcast": (
    account: AccountLike,
    parentAccount: Account | undefined,
    mainAccount: Account,
    optimisticOperation: Operation,
  ) => void;
  "device.transport": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "device.select": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "exchange.start": (params: {
    exchangeType: "FUND" | "SELL" | "SWAP";
    onSuccess: (nonce: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
}

function usePermission(manifest: AppManifest): Permission {
  return useMemo(
    () => ({
      currencyIds: manifest.currencies === "*" ? ["**"] : manifest.currencies,
      methodIds: manifest.permissions as unknown as string[], // TODO remove when using the correct manifest type
    }),
    [manifest],
  );
}

function useTransport(postMessage: (message: string) => void | undefined): Transport {
  return useMemo(() => {
    return {
      onMessage: undefined,
      send: postMessage,
    };
  }, [postMessage]);
}

export function useConfig({ appId, userId, tracking, wallet }: ServerConfig): ServerConfig {
  return useMemo(
    () => ({
      appId,
      userId,
      tracking,
      wallet,
    }),
    [appId, tracking, userId, wallet],
  );
}

function useDeviceTransport({ manifest }) {
  const ref = useRef<Subject<BidirectionalEvent> | undefined>();

  const subscribe = useCallback((deviceId: string) => {
    ref.current = openTransportAsSubject({ deviceId });

    ref.current.subscribe({
      complete: () => {
        ref.current = undefined;
      },
    });
  }, []);

  const close = useCallback(() => {
    ref.current?.complete();
  }, []);

  const exchange = useCallback<WalletHandlers["device.exchange"]>(
    ({ apduHex }) => {
      const subject$ = ref.current;

      return new Promise((resolve, reject) => {
        if (!subject$) {
          reject(new Error("No device transport"));
          return;
        }

        subject$.pipe(first(e => e.type === "device-response" || e.type === "error")).subscribe({
          next: e => {
            if (e.type === "device-response") {
              
              resolve(e.data);
              return;
            }
            if (e.type === "error") {
              
              reject(e.error || new Error("deviceExchange: unknown error"));
            }
          },
          error: error => {
            
            reject(error);
          },
        });

        subject$.next({ type: "input-frame", apduHex });
      });
    },
    [manifest, null],
  );

  useEffect(() => {
    return () => {
      ref.current?.complete();
    };
  }, []);

  return useMemo(() => ({ ref, subscribe, close, exchange }), [close, exchange, subscribe]);
}

const allCurrenciesAndTokens = listCurrencies(true);

export type useWalletAPIServerOptions = {
  manifest: AppManifest;
  accounts: AccountLike[];
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
    postMessage: (message: string) => void;
  };
  uiHook: Partial<UiHook>;
  customHandlers?: WalletAPICustomHandlers;
};

export function useWalletAPIServer({
  manifest,
  accounts,
  config,
  webviewHook,
  uiHook: {
    "account.request": uiAccountRequest,
    "account.receive": uiAccountReceive,
    "message.sign": uiMessageSign,
    "storage.get": uiStorageGet,
    "storage.set": uiStorageSet,
    "transaction.sign": uiTxSign,
    "transaction.broadcast": uiTxBroadcast,
    "device.transport": uiDeviceTransport,
    "device.select": uiDeviceSelect,
    "exchange.start": uiExchangeStart,
    "exchange.complete": uiExchangeComplete,
  },
  customHandlers,
}: useWalletAPIServerOptions): {
  onMessage: (event: string) => void;
  widgetLoaded: boolean;
  onLoad: () => void;
  onReload: () => void;
  onLoadError: () => void;
} {
  const permission = usePermission(manifest);
  const transport = useTransport(webviewHook.postMessage);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const walletAPIAccounts = useWalletAPIAccounts(accounts);
  const walletAPICurrencies = useWalletAPICurrencies();

  const { server, onMessage } = useWalletAPIServerRaw({
    transport,
    config,
    accounts: walletAPIAccounts,
    currencies: walletAPICurrencies,
    permission,
    customHandlers,
  });

  useEffect(() => {
    if (!uiAccountRequest) return;

    server.setHandler("account.request", async ({ accounts$, currencies$ }) => {
      
      const currencies = await firstValueFrom(currencies$);

      return new Promise((resolve, reject) => {
        // handle no curencies selected case
        const currencyIds = currencies.map(({ id }) => id);

        let currencyList: CryptoOrTokenCurrency[] = [];
        // if single currency available redirect to select account directly
        if (currencyIds.length === 1) {
          const currency = findCryptoCurrencyById(currencyIds[0]) || findTokenById(currencyIds[0]);
          if (currency) {
            currencyList = [currency];
          }

          if (!currencyList[0]) {
            
            // @TODO replace with correct error
            reject(new ServerError(createCurrencyNotFound(currencyIds[0])));
          }
        } else {
          currencyList = allCurrenciesAndTokens.filter(({ id }) => currencyIds.includes(id));
        }

        uiAccountRequest({
          accounts$,
          currencies: currencyList,
          onSuccess: (account: AccountLike, parentAccount: Account | undefined) => {
            
            resolve(accountToWalletAPIAccount(account, parentAccount));
          },
          onCancel: () => {
            
            reject(new Error("Canceled by user"));
          },
        });
      });
    });
  }, [manifest, server, null, uiAccountRequest]);

  useEffect(() => {
    if (!uiAccountReceive) return;

    server.setHandler("account.receive", ({ account }) =>
      receiveOnAccountLogic(
        { manifest, accounts },
        account.id,
        (account, parentAccount, accountAddress) =>
          new Promise((resolve, reject) =>
            uiAccountReceive({
              account,
              parentAccount,
              accountAddress,
              onSuccess: accountAddress => {
                
                resolve(accountAddress);
              },
              onCancel: () => {
                
                reject(new Error("User cancelled"));
              },
              onError: error => {
                
                reject(error);
              },
            }),
          ),
      ),
    );
  }, [accounts, manifest, server, null, uiAccountReceive]);

  useEffect(() => {
    if (!uiMessageSign) return;

    server.setHandler("message.sign", ({ account, message }) =>
      signMessageLogic(
        { manifest, accounts },
        account.id,
        message.toString("hex"),
        (account: AccountLike, message: AnyMessage) =>
          new Promise((resolve, reject) => {
            return uiMessageSign({
              account,
              message,
              onSuccess: signature => {
                
                resolve(Buffer.from(signature.replace("0x", ""), "hex"));
              },
              onCancel: () => {
                
                reject(new UserRefusedOnDevice());
              },
              onError: error => {
                
                reject(error);
              },
            });
          }),
      ),
    );
  }, [accounts, manifest, server, null, uiMessageSign]);

  useEffect(() => {
    if (!uiStorageGet) return;

    server.setHandler("storage.get", uiStorageGet);
  }, [server, uiStorageGet]);

  useEffect(() => {
    if (!uiStorageSet) return;

    server.setHandler("storage.set", uiStorageSet);
  }, [server, uiStorageSet]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler("transaction.sign", async ({ account, transaction, options }) => {
      const signedOperation = await signTransactionLogic(
        { manifest, accounts },
        account.id,
        transaction,
        (account, parentAccount, signFlowInfos) =>
          new Promise((resolve, reject) =>
            uiTxSign({
              account,
              parentAccount,
              signFlowInfos,
              options,
              onSuccess: signedOperation => {
                
                resolve(signedOperation);
              },
              onError: error => {
                
                reject(error);
              },
            }),
          ),
      );

      return Buffer.from(signedOperation.signature);
    });
  }, [accounts, manifest, server, null, uiTxSign]);

  useEffect(() => {
    if (!uiTxSign) return;

    server.setHandler("transaction.signAndBroadcast", async ({ account, transaction, options }) => {
      const signedTransaction = await signTransactionLogic(
        { manifest, accounts },
        account.id,
        transaction,
        (account, parentAccount, signFlowInfos) =>
          new Promise((resolve, reject) =>
            uiTxSign({
              account,
              parentAccount,
              signFlowInfos,
              options,
              onSuccess: signedOperation => {
                
                resolve(signedOperation);
              },
              onError: error => {
                
                reject(error);
              },
            }),
          ),
      );

      return broadcastTransactionLogic(
        { manifest, accounts },
        account.id,
        signedTransaction,
        async (account, parentAccount, signedOperation) => {
          const bridge = getAccountBridge(account, parentAccount);
          const mainAccount = getMainAccount(account, parentAccount);

          let optimisticOperation: Operation = signedOperation.operation;

          if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
            try {
              optimisticOperation = await bridge.broadcast({
                account: mainAccount,
                signedOperation,
              });
              
            } catch (error) {
              
              throw error;
            }
          }

          uiTxBroadcast && uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);

          return optimisticOperation.hash;
        },
      );
    });
  }, [accounts, manifest, server, null, uiTxBroadcast, uiTxSign]);

  const onLoad = useCallback(() => {
    
    setWidgetLoaded(true);
  }, [manifest, null]);

  const onReload = useCallback(() => {
    
    setWidgetLoaded(false);

    webviewHook.reload();
  }, [manifest, null, webviewHook]);

  const onLoadError = useCallback(() => {
    
  }, [manifest, null]);

  const device = useDeviceTransport({ manifest });

  useEffect(() => {
    if (!uiDeviceTransport) return;

    server.setHandler(
      "device.transport",
      ({ appName, appVersionRange, devices }) =>
        new Promise((resolve, reject) => {
          if (device.ref.current) {
            return reject(new Error("Device already opened"));
          }

          

          return uiDeviceTransport({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {
              

              if (!deviceParam) {
                reject(new Error("No device"));
                return;
              }
              if (devices && !devices.includes(deviceParam.modelId)) {
                reject(new Error("Device not in the devices list"));
                return;
              }
              if (
                appVersionRange &&
                appAndVersion &&
                semver.satisfies(appAndVersion.version, appVersionRange)
              ) {
                reject(new Error("App version doesn't satisfies the range"));
                return;
              }
              // TODO handle appFirmwareRange & seeded params
              device.subscribe(deviceParam.deviceId);
              resolve("1");
            },
            onCancel: () => {
              reject(new Error("User cancelled"));
            },
          });
        }),
    );
  }, [device, manifest, server, null, uiDeviceTransport]);

  useEffect(() => {
    if (!uiDeviceSelect) return;

    server.setHandler(
      "device.select",
      ({ appName, appVersionRange, devices }) =>
        new Promise((resolve, reject) => {
          if (device.ref.current) {
            return reject(new Error("Device already opened"));
          }


          return uiDeviceSelect({
            appName,
            onSuccess: ({ device: deviceParam, appAndVersion }) => {

              if (!deviceParam) {
                reject(new Error("No device"));
                return;
              }
              if (devices && !devices.includes(deviceParam.modelId)) {
                reject(new Error("Device not in the devices list"));
                return;
              }
              if (
                appVersionRange &&
                appAndVersion &&
                semver.satisfies(appAndVersion.version, appVersionRange)
              ) {
                reject(new Error("App version doesn't satisfies the range"));
                return;
              }
              resolve(deviceParam.deviceId);
            },
            onCancel: () => {
              
              reject(new Error("User cancelled"));
            },
          });
        }),
    );
  }, [device.ref, manifest, server, null, uiDeviceSelect]);

  useEffect(() => {
    server.setHandler("device.open", params => {
      if (device.ref.current) {
        return Promise.reject(new Error("Device already opened"));
      }

      

      device.subscribe(params.deviceId);
      return "1";
    });
  }, [device, manifest, server, null]);

  useEffect(() => {
    server.setHandler("device.exchange", params => {
      if (!device.ref.current) {
        return Promise.reject(new Error("No device opened"));
      }

      

      return device.exchange(params);
    });
  }, [device, manifest, server, null]);

  useEffect(() => {
    server.setHandler("device.close", ({ transportId }) => {
      if (!device.ref.current) {
        return Promise.reject(new Error("No device opened"));
      }

      

      device.close();

      

      return Promise.resolve(transportId);
    });
  }, [device, manifest, server, null]);

  useEffect(() => {
    server.setHandler("bitcoin.getXPub", ({ accountId }) => {
      return bitcoinFamillyAccountGetXPubLogic({ manifest, accounts }, accountId);
    });
  }, [accounts, manifest, server, null]);

  useEffect(() => {
    if (!uiExchangeStart) {
      return;
    }

    server.setHandler("exchange.start", ({ exchangeType }) => {
      return startExchangeLogic(
        { manifest, accounts },
        exchangeType,
        (exchangeType: "SWAP" | "FUND" | "SELL") =>
          new Promise((resolve, reject) =>
            uiExchangeStart({
              exchangeType,
              onSuccess: (nonce: string) => {
                
                resolve(nonce);
              },
              onCancel: error => {
                
                reject(error);
              },
            }),
          ),
      );
    });
  }, [uiExchangeStart, accounts, manifest, server, null]);

  useEffect(() => {
    if (!uiExchangeComplete) {
      return;
    }

    server.setHandler("exchange.complete", params => {
      // retrofit of the exchange params to fit the old platform spec
      const request: CompleteExchangeRequest = {
        provider: params.provider,
        fromAccountId: params.fromAccount.id,
        toAccountId: params.exchangeType === "SWAP" ? params.toAccount.id : undefined,
        transaction: params.transaction,
        binaryPayload: params.binaryPayload.toString("hex"),
        signature: params.signature.toString("hex"),
        feesStrategy: params.feeStrategy,
        exchangeType: ExchangeType[params.exchangeType],
        swapId: params.exchangeType === "SWAP" ? params.swapId : undefined,
        rate: params.exchangeType === "SWAP" ? params.rate : undefined,
        tokenCurrency: params.exchangeType !== "SELL" ? params.tokenCurrency : undefined,
      };

      return completeExchangeLogic(
        { manifest, accounts },
        request,
        request =>
          new Promise((resolve, reject) =>
            uiExchangeComplete({
              exchangeParams: request,
              onSuccess: (hash: string) => {
                
                resolve(hash);
              },
              onCancel: error => {
                
                reject(error);
              },
            }),
          ),
      );
    });
  }, [uiExchangeComplete, accounts, manifest, server, null]);

  return {
    widgetLoaded,
    onMessage,
    onLoad,
    onReload,
    onLoadError,
  };
}

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}

export interface Categories {
  manifests: {
    all: AppManifest[];
    complete: AppManifest[];
    searchable: AppManifest[];
  };
  searchable: AppManifest[];
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
  selected: string;
  setSelected: (val: string) => void;
  reset: () => void;
}

export function useCategories(): Categories {
  const all = useManifests();
  const complete = useMemo(() => all.filter(m => m.visibility === "complete"), [all]);
  const searchable = useMemo(
    () => all.filter(m => ["complete", "searchable"].includes(m.visibility)),
    [all],
  );
  const { categories, manifestsByCategories } = useCategoriesRaw(searchable);
  const [selected, setSelected] = useState(DISCOVER_INITIAL_CATEGORY);

  const reset = useCallback(() => {
    setSelected(DISCOVER_INITIAL_CATEGORY);
  }, []);

  return useMemo(
    () => ({
      manifests: {
        all,
        complete,
        searchable,
      },
      searchable,
      categories,
      manifestsByCategories,
      selected,
      setSelected,
      reset,
    }),
    [all, complete, searchable, categories, manifestsByCategories, selected, setSelected, reset],
  );
}

function useCategoriesRaw(manifests: AppManifest[]): {
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
} {
  const manifestsByCategories = useMemo(() => {
    const res = manifests.reduce(
      (res, m) => {
        m.categories.forEach(c => {
          const list = res.has(c) ? [...res.get(c), m] : [m];
          res.set(c, list);
        });

        return res;
      },
      new Map().set("all", manifests),
    );

    return res;
  }, [manifests]);

  const categories = useMemo(() => [...manifestsByCategories.keys()], [manifestsByCategories]);

  return {
    categories,
    manifestsByCategories,
  };
}

export type RecentlyUsedDB = StateDB<DiscoverDB, DiscoverDB["recentlyUsed"]>;

export interface RecentlyUsed {
  data: RecentlyUsedManifest[];
  append: (manifest: AppManifest) => void;
  clear: () => void;
}

export type RecentlyUsedManifest = AppManifest & { usedAt?: Date };

export function useRecentlyUsed(
  manifests: AppManifest[],
  [recentlyUsed, setState]: RecentlyUsedDB,
): RecentlyUsed {
  const data = useMemo(
    () =>
      recentlyUsed
        .map(r => {
          const res = manifests.find(m => m.id === r.id);
          const distance = formatDistanceToNow(new Date(r.usedAt));
          return res
            ? {
                ...res,
                usedAt: distance[0].toUpperCase() + distance.slice(1) + " ago",
              }
            : res;
        })
        .filter(m => m !== undefined) as AppManifest[],
    [recentlyUsed, manifests],
  );

  const append = useCallback(
    (manifest: AppManifest) => {
      setState(state => {
        const index = state.recentlyUsed.findIndex(({ id }) => id === manifest.id);

        // Manifest already in first position
        if (index === 0) {
          return {
            ...state,
            recentlyUsed: [
              { ...state.recentlyUsed[0], usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(1),
            ],
          };
        }

        // Manifest present we move it to the first position
        // No need to check for MAX_LENGTH as we only move it
        if (index !== -1) {
          return {
            ...state,
            recentlyUsed: [
              { id: manifest.id, usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(0, index),
              ...state.recentlyUsed.slice(index + 1),
            ],
          };
        }

        // Manifest not preset we simply append and check for the length
        return {
          ...state,
          recentlyUsed:
            state.recentlyUsed.length >= MAX_RECENTLY_USED_LENGTH
              ? [
                  { id: manifest.id, usedAt: new Date().toISOString() },
                  ...state.recentlyUsed.slice(0, -1),
                ]
              : [{ id: manifest.id, usedAt: new Date().toISOString() }, ...state.recentlyUsed],
        };
      });
    },
    [setState],
  );

  const clear = useCallback(() => {
    setState(state => ({ ...state, recentlyUsed: [] }));
  }, [setState]);

  return { data, append, clear };
}

export interface DisclaimerRaw {
  onConfirm: (manifest: AppManifest, isChecked: boolean) => void;
  onSelect: (manifest: AppManifest) => void;
}

interface DisclaimerUiHook {
  prompt: (
    manifest: AppManifest,
    onContinue: (manifest: AppManifest, isChecked: boolean) => void,
  ) => void;
  dismiss: () => void;
  openApp: (manifest: AppManifest) => void;
  close: () => void;
}

export function useDisclaimerRaw({
  isReadOnly = false,
  isDismissed,
  uiHook,
  appendRecentlyUsed,
}: {
  // used only on mobile for now
  isReadOnly?: boolean;
  isDismissed: boolean;
  appendRecentlyUsed: (manifest: AppManifest) => void;
  uiHook: DisclaimerUiHook;
}): DisclaimerRaw {
  const onConfirm = useCallback(
    (manifest: AppManifest, isChecked: boolean) => {
      if (!manifest) return;

      if (isChecked) {
        uiHook.dismiss();
      }

      uiHook.close();
      appendRecentlyUsed(manifest);
      uiHook.openApp(manifest);
    },
    [uiHook, appendRecentlyUsed],
  );

  const onSelect = useCallback(
    (manifest: AppManifest) => {
      if (manifest.branch === "soon") {
        return;
      }

      if (!isDismissed && !isReadOnly && manifest.author !== "ledger") {
        uiHook.prompt(manifest, onConfirm);
      } else {
        appendRecentlyUsed(manifest);
        uiHook.openApp(manifest);
      }
    },
    [isReadOnly, isDismissed, uiHook, appendRecentlyUsed, onConfirm],
  );

  return {
    onSelect,
    onConfirm,
  };
}
