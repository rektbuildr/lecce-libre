import { Middleware } from "redux";
import { WalletSyncClient } from "@ledgerhq/wss-sdk";
import { replaceAccounts } from "../actions/accounts";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { State } from "../reducers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies/index";
import { AccountsState } from "../reducers/accounts";
type WalletSyncAccount =
  | {
      currencyId: string;
      seedId: string;
      derivationPath: string;
      type: "xPub";
      name: string;
      derivationMode: string;
      xPub: string;
    }
  | {
      address: string;
      currencyId: string;
      seedId: string;
      derivationPath: string;
      type: "address";
      name: string;
      derivationMode: string;
    };

function convertLiveAccountToWalletSyncAccount(ledgerLiveAccount: Account): WalletSyncAccount {
  const derivationMode =
    ledgerLiveAccount.derivationMode === "" ? "default" : ledgerLiveAccount.derivationMode;

  if (ledgerLiveAccount.xpub) {
    return {
      type: "xPub",
      xPub: ledgerLiveAccount.xpub,
      currencyId: ledgerLiveAccount.currency.id,
      seedId: ledgerLiveAccount.seedIdentifier,
      derivationPath: ledgerLiveAccount.freshAddressPath,
      name: ledgerLiveAccount.name,
      derivationMode,
    };
  }

  return {
    type: "address",
    address: ledgerLiveAccount.freshAddress,
    currencyId: ledgerLiveAccount.currency.id,
    seedId: ledgerLiveAccount.seedIdentifier,
    derivationPath: ledgerLiveAccount.freshAddressPath,
    name: ledgerLiveAccount.name,
    derivationMode,
  };
}

function convertWalletSyncAccountToLiveAccount(walletSyncAccount: WalletSyncAccount) {
  const derivationMode =
    walletSyncAccount.derivationMode === "default" ? "" : walletSyncAccount.derivationMode;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: walletSyncAccount.currencyId,
    xpubOrAddress:
      walletSyncAccount.type === "xPub" ? walletSyncAccount.xPub : walletSyncAccount.address,
    derivationMode,
  });

  const cryptoCurrency = getCryptoCurrencyById(walletSyncAccount.currencyId);

  const account: Account = {
    type: "Account",
    id: accountId,
    seedIdentifier: walletSyncAccount.seedId,
    derivationMode,
    index: 0,
    xpub: walletSyncAccount.type === "xPub" ? walletSyncAccount.xPub : undefined, // xPub type account
    freshAddress: walletSyncAccount.type === "address" ? walletSyncAccount.address : "", // address type account
    freshAddressPath: walletSyncAccount.derivationPath,
    freshAddresses: [],
    name: walletSyncAccount.name,
    starred: false,
    used: false,
    creationDate: new Date("2021-03-23T14:17:07.001Z"),
    balance: new BigNumber("22913015427119498"),
    spendableBalance: new BigNumber("22913015427119498"),
    lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
    blockHeight: 16191372,
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: 1676329200000 },
      DAY: { balances: [], latestDate: 1676329200000 },
      WEEK: { balances: [], latestDate: 1676329200000 },
    },
    swapHistory: [],
    unit: cryptoCurrency.units[0],
    currency: cryptoCurrency,
  };

  return account;
}

/*
const convertWalletSyncAccountToLiveAccount = async (
  walletSyncAccount: WalletSyncAccount,
): Promise<Account> => {
  if (walletSyncAccount.type === "xPub") {
    const bitcoinLLWallet = new BitcoinLikeWallet();
    const { derivationPath, xPub } = walletSyncAccount;
    const account: Account = await bitcoinLLWallet.generateAccount(
      {
        xpub: xPub,
        path: derivationPath,
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },

      getCryptoCurrencyById("bitcoin"),
    );
    return account;
  }

  const { currencyId, address, seedId, derivationPath } = walletSyncAccount;
  return {
    ...walletSyncAccount,
    type: "Account",
    id: `js:${currencyId}:${address}`,
    seedIdentifier: seedId,
    index: 0,
    freshAddress: address,
    freshAddressPath: derivationPath,
    freshAddresses: [
      {
        address,
        derivationPath,
      },
    ],
    starred: false,
    used: false,
    creationDate: new Date("2021-03-23T14:17:07.001Z"),
    balance: new BigNumber("22913015427119498"),
    spendableBalance: new BigNumber("22913015427119498"),
    lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
    blockHeight: 16191372,
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: 1676329200000 },
      DAY: { balances: [], latestDate: 1676329200000 },
      WEEK: { balances: [], latestDate: 1676329200000 },
    },
    swapHistory: [],
    unit: {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
    currency: getCryptoCurrencyById("ethereum"),
  };
};
*/

function getIndexedAccounts(accounts: AccountsState): Map<string, Account> {
  return accounts.reduce((acc: Map<string, Account>, account) => {
    acc.set(account.id, account);
    return acc;
  }, new Map());
}

function shouldSyncWallet(oldAccounts: AccountsState, newAccounts: AccountsState): boolean {
  const oldAccountsById = getIndexedAccounts(oldAccounts);
  const newAccountsById = getIndexedAccounts(newAccounts);

  for (let i = 0; i < newAccounts.length; i++) {
    const newAccount = newAccounts[i];
    const oldAccount = oldAccountsById.get(newAccount.id);

    // account was just created
    if (!oldAccount) {
      return true;
    }

    // account name changed
    if (newAccount.name !== oldAccount.name) {
      return true;
    }

    // account ordering changed
    if (oldAccounts[i] && oldAccounts[i].id !== newAccount.id) {
      return true;
    }
  }

  for (let i = 0; i < oldAccounts.length; i++) {
    const oldAccount = oldAccounts[i];
    const newAccount = newAccountsById.get(oldAccount.id);

    // account was just deleted
    if (!newAccount) {
      return true;
    }
  }
  return false;
}

const auth = Buffer.from("UzLcjVdLnRmgxhsLS5SDDxP0jHUMUneHKYDEAy5oFw8=", "base64");
const walletSyncParams = {
  url: "http://localhost:3000",
  pollFrequencyMs: 5000,
  auth,
};

const client = new WalletSyncClient(walletSyncParams);

const walletSyncMiddleware: Middleware<{}, State> = store => next => async action => {
  if (action.type === "INIT_WALLET_SYNC") {
    client.observable().subscribe(accountMetadata => {
      const newAccounts = accountMetadata.accounts.map(account =>
        convertWalletSyncAccountToLiveAccount(account),
      );
      console.log({ newAccounts });
      store.dispatch(replaceAccounts(newAccounts));
    });

    client.setVersion(0);
    client.start();
  }

  const oldState = store.getState();
  const oldAccounts = oldState.accounts;

  next(action);

  const newState = store.getState();
  const newAccounts = newState.accounts;

  console.log({ oldState, newState });

  // something changed
  if (newAccounts !== oldAccounts && shouldSyncWallet(oldAccounts, newAccounts)) {
    console.log("accounts changed");

    const walletSyncAccounts = newAccounts.map(liveAccount => {
      return convertLiveAccountToWalletSyncAccount(liveAccount);
    });

    client.saveData({
      accounts: walletSyncAccounts,
    });
  }
};

export default walletSyncMiddleware;
