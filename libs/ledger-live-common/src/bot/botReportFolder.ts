import fs from "fs";
import path from "path";
import { toAccountRaw } from "../account";
import { getEnv } from "../env";
import { sha256 } from "../crypto";
import type {
  MutationReport,
  MinimalSerializedMutationReport,
  MinimalSerializedReport,
  MinimalSerializedSpecReport,
  SpecReport,
} from "./types";
import { formatError } from "./formatters";
import { Transaction } from "../generated/types";
import { Account } from "@ledgerhq/types-live";

function convertMutation<T extends Transaction>(
  report: MutationReport<T>,
): MinimalSerializedMutationReport {
  const { appCandidate, mutation, account, destination, error, operation } = report;
  return {
    appCandidate,
    mutationName: mutation?.name,
    accountId: account?.id,
    destinationId: destination?.id,
    operationId: operation?.id,
    error: error ? formatError(error) : undefined,
  };
}

function convertSpecReport<T extends Transaction>(
  result: SpecReport<T>,
): MinimalSerializedSpecReport {
  const accounts = result.accountsAfter?.map(a => {
    // remove the "expensive" data fields
    const raw = toAccountRaw(a);
    raw.operations = [];
    delete raw.balanceHistoryCache;
    if (raw.subAccounts) {
      raw.subAccounts.forEach(a => {
        a.operations = [];
        delete a.balanceHistoryCache;
      });
    }
    const unsafe = raw as any;
    if (unsafe.bitcoinResources) {
      delete unsafe.bitcoinResources.walletAccount;
    }
    return raw;
  });
  const mutations = result.mutations?.map(convertMutation);
  return {
    specName: result.spec.name,
    fatalError: result.fatalError ? formatError(result.fatalError) : undefined,
    accounts,
    mutations,
    existingMutationNames: result.spec.mutations.map(m => m.name),
    hintWarnings: result.hintWarnings,
  };
}

function makeAppJSON(accounts: Account[]) {
  const jsondata = {
    data: {
      settings: {
        hasCompletedOnboarding: true,
      },
      accounts: accounts.map((account) => ({
        data: toAccountRaw(account),
        version: 1,
      })),
    },
  };
  return JSON.stringify(jsondata);
}

export const botReportFolder = async ({
  BOT_REPORT_FOLDER,
  body,
  slackCommentTemplate,
  allAccountsAfter,
  results,
  allAppPaths,
  githubBody
}: {
  BOT_REPORT_FOLDER: string;
  body: string;
  slackCommentTemplate: string;
  allAccountsAfter: Account[];
  results: SpecReport<any>[],
  allAppPaths: string[],
  githubBody: string
}) => {
  if (BOT_REPORT_FOLDER) {
const BOT_ENVIRONMENT = getEnv("BOT_ENVIRONMENT");
    const serializedReport: MinimalSerializedReport = {
      results: results.map(convertSpecReport),
      environment: BOT_ENVIRONMENT,
      seedHash: sha256(getEnv("SEED")),
    };

    await Promise.all([
      fs.promises.writeFile(path.join(BOT_REPORT_FOLDER, "github-report.md"), githubBody, "utf-8"),
      fs.promises.writeFile(path.join(BOT_REPORT_FOLDER, "full-report.md"), body, "utf-8"),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "slack-comment-template.md"),
        slackCommentTemplate,
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "app.json"),
        makeAppJSON(allAccountsAfter),
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "coin-apps.json"),
        JSON.stringify(allAppPaths),
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "report.json"),
        JSON.stringify(serializedReport),
        "utf-8",
      ),
    ]);
  }
};
