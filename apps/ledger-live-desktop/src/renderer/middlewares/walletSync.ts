import { Middleware } from "redux";
import { WalletSyncClient } from "@ledgerhq/wss-sdk/src/index";
import { replaceAccounts } from "../actions/accounts";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
// eslint-disable-next-line no-restricted-imports
import {
  BitcoinLikeWallet,
  DerivationModes,
} from "@ledgerhq/live-common/families/bitcoin/wallet-btc/index";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies";

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

const walletSyncMiddleware: Middleware = store => next => async action => {
  if (action.type === "INIT_WALLET_SYNC") {
    const walletSyncParams = {
      url: "http://localhost:3000",
      pollFrequencyMs: 5000,
      auth: Buffer.from("UzLcjVdLnRmgxhsLS5SDDxP0jHUMUneHKYDEAy5oFw8=", "base64"),
    };

    const client = new WalletSyncClient(walletSyncParams);
    client.observable().subscribe(accountMetadata => {
      const newAccounts = accountMetadata.accounts.map(account =>
        convertWalletSyncAccountToLiveAccount(account),
      );
      store.dispatch(replaceAccounts(newAccounts));
    });
  }

  next(action);
};

export default walletSyncMiddleware;
