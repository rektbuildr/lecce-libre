import "dotenv/config";
import axios from "axios";
import pick from "lodash/pick";
import omit from "lodash/omit";
import { ethers } from "ethers";
import { tap } from "rxjs/operators";
import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import makeGetAddress from "@ledgerhq/coin-evm/hw-getAddress";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  makeAccount,
  makeTokenAccount,
} from "@ledgerhq/coin-evm/__tests__/fixtures/common.fixtures";
import { buildAccountBridge } from "@ledgerhq/coin-evm/bridge/js";
import { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { ERC20Interface, USDC, provider } from "./helpers";
import { spawnSpeculos } from "./speculos";
import { ENV, NanoApp } from "./types";

const { API_PORT } = process.env as ENV;

export const execute = async (scenario: Scenario) => {
  if (!API_PORT) throw new Error("incorrect env file");

  const transport = await spawnSpeculos({
    nanoApp: scenario.nanoApp,
  }).catch(e => {
    console.error(e);
    throw e;
  });

  const signerContext = (deviceId: string, fn: any) => fn(new Eth(transport));
  const getAddress = makeGetAddress(signerContext);
  const { address } = await getAddress("", {
    path: "44'/60'/0'/0/0",
    currency: scenario.currency,
    derivationMode: "",
  });

  await scenario.beforeTransactions?.(address);

  console.log("---- Address ----", address);

  const accountBridge = buildAccountBridge(signerContext);
  const baseAccount = makeAccount(address, scenario.currency);
  let account = await accountBridge
    .sync(baseAccount, { paginationConfig: {} })
    .toPromise()
    .then(updater => {
      if (!updater || !baseAccount) throw new Error("No updater or account");
      return updater(baseAccount);
    })
    .catch(e => {
      console.error("SYNC ERROR", e);
      throw e;
    });

  for (const testTransaction of scenario.transactions) {
    if (testTransaction.subAccountId) {
      const { token } = decodeTokenAccountId(testTransaction.subAccountId);
      if (!token) throw new Error("SubAccountId invalid");
      const tokenAccount = makeTokenAccount(account.freshAddress, token);
      if (!account.subAccounts?.find(({ id }) => id === tokenAccount.id))
        account.subAccounts?.push(tokenAccount);
    }

    const syncedAccount = await accountBridge
      .sync(account, { paginationConfig: {} })
      .toPromise()
      .then(updater => {
        if (!updater || !account) throw new Error("No updater or account");
        return updater(account);
      });

    console.log(
      "Accout ETH balance:",
      `${ethers.utils.formatEther(account.balance.toFixed())} ETH`,
    );
    account.subAccounts?.forEach(tokenAccount => {
      if (tokenAccount.type !== "TokenAccount") return;
      console.log(
        "Token Account balance:",
        `${ethers.utils.formatUnits(
          tokenAccount.balance.toString(),
          tokenAccount.token.units[0].magnitude,
        )} ${tokenAccount.token.ticker}`,
      );
    });
    console.log(
      "Account USDC balance:",
      `${ethers.utils.formatUnits(
        await provider.call({
          to: USDC.contractAddress,
          data: ERC20Interface.encodeFunctionData("balanceOf", [address]),
        }),
        6,
      )} USDC`,
    );

    if (!syncedAccount) throw new Error("No Synced Account");

    console.log(
      `\n\n\n ------------ TRANSACTION N° ${
        scenario.transactions.indexOf(testTransaction) + 1
      } ------------ `,
    );

    const defaultTransaction = accountBridge.createTransaction(syncedAccount);
    const transaction = await accountBridge.prepareTransaction(syncedAccount, {
      ...defaultTransaction,
      ...testTransaction,
    } as Transaction);

    const status = await accountBridge.getTransactionStatus(syncedAccount, transaction);
    console.log("Status:");
    console.table(
      Object.fromEntries(
        Object.entries(omit(status, ["errors", "warnings"])).map(([a, b]) => [
          a,
          BigNumber.isBigNumber(b) ? b.toFixed() : b.toString(),
        ]),
      ),
    );
    if (Object.values(status.errors).length) {
      console.log("Errors:");
      console.table(
        Object.fromEntries(Object.entries(status.errors).map(([a, b]) => [a, b.toString()])),
      );
    }
    if (Object.values(status.warnings).length) {
      console.log("Warnings:");
      console.table(
        Object.fromEntries(Object.entries(status.warnings).map(([a, b]) => [a, b.toString()])),
      );
    }

    const { signedOperation } = (await accountBridge
      .signOperation({
        account,
        transaction,
        deviceId: "",
      })
      .pipe(
        // @ts-ignore
        tap({
          next: async val => {
            const recursiveAutoSigner = async () => {
              if (val.type === "device-signature-requested") {
                const { data } = await axios.get(
                  `http://localhost:${API_PORT}/events?currentscreenonly=true`,
                );

                if (data.events[0].text !== "Accept") {
                  await axios.post(`http://localhost:${API_PORT}/button/right`, {
                    action: "press-and-release",
                  });
                  recursiveAutoSigner();
                } else {
                  await axios.post(`http://localhost:${API_PORT}/button/both`, {
                    action: "press-and-release",
                  });
                }
              }
            };
            await recursiveAutoSigner();
          },
          error: error => {
            console.log("Failed to sign", error.message);
          },
          complete: () => console.log("\n———\n\n ✔️  Signed the transaction ✍️ \n\n———\n\n"),
        }),
      )
      .toPromise()) as SignOperationEvent & { type: "signed" };

    const optimisticOperation = await accountBridge
      .broadcast({ account, signedOperation })
      .catch(e => {
        console.debug("TRANSACTION FAILED BROADCASTING ❌");
        console.debug({ message: e.message });
        return null;
      });

    if (!optimisticOperation) continue;

    const updatedAccount: Account = await accountBridge
      .sync(
        { ...account, pendingOperations: [optimisticOperation] },
        {
          paginationConfig: {},
        },
      )
      .toPromise()
      .then(updater => {
        if (!updater || !account) throw new Error("No updater or account");
        return updater(account);
      });

    if (!updatedAccount) throw new Error("No Updated Account");
    account = updatedAccount;

    console.log(
      "Updated Account",
      pick(updatedAccount, ["balance", "freshAddress", "operationsCount", "operations"]),
    );

    console.log(
      "Accout ETH balance:",
      `${ethers.utils.formatEther(account.balance.toFixed())} ETH`,
    );
    account.subAccounts?.forEach(tokenAccount => {
      if (tokenAccount.type !== "TokenAccount") return;
      console.log(
        "Token Account balance:",
        `${ethers.utils.formatUnits(
          tokenAccount.balance.toString(),
          tokenAccount.token.units[0].magnitude,
        )} ${tokenAccount.token.ticker}`,
      );
    });
  }

  return "done";
};

export type Scenario = {
  currency: CryptoCurrency;
  transactions: Partial<Transaction>[];
  nanoApp: NanoApp;
  beforeTransactions?: (address: string) => Promise<void>;
};
