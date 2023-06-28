/* eslint-disable no-console */
import { getContext } from "@ledgerhq/coin-framework/bot/bot-test-context";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import uniq from "lodash/uniq";
import { formatAccount, isAccountEmpty } from "../account";
import {
  inferTrackingPairForAccounts,
  initialState,
  loadCountervalues,
} from "../countervalues/logic";
import {
  findCryptoCurrencyByKeyword,
  formatCurrencyUnit,
  getFiatCurrencyByTicker,
  isCurrencySupported,
} from "../currencies";
import { getEnv } from "../env";
import allSpecs from "../generated/specs";
import { getPortfolio } from "../portfolio/v2";
import { promiseAllBatched } from "../promise";
import { botReportFolder } from "./botReportFolder";
import { runWithAppSpec } from "./engine";
import { formatError, formatReportForConsole, formatTime } from "./formatters";
import type {
  AppSpec,
  MutationReport,
  SpecReport
} from "./types";

type Arg = Partial<{
  currency: string;
  family: string;
  mutation: string;
}>;

const usd = getFiatCurrencyByTicker("USD");

export async function bot({ currency, family, mutation }: Arg = {}): Promise<void> {
  const specs: any[] = [];
  const specsLogs: string[][] = [];
  const maybeCurrency = currency ? findCryptoCurrencyByKeyword(currency) : undefined;
  const maybeFilterOnlyFamily = family;

  for (const family in allSpecs) {
    const familySpecs = allSpecs[family];
    if (maybeFilterOnlyFamily && maybeFilterOnlyFamily !== family) {
      continue;
    }

    for (const key in familySpecs) {
      let spec: AppSpec<any> = familySpecs[key];

      if (!isCurrencySupported(spec.currency) || spec.disabled) {
        continue;
      }

      if (!maybeCurrency || maybeCurrency === spec.currency) {
        if (mutation) {
          spec = {
            ...spec,
            mutations: spec.mutations.filter(m => new RegExp(mutation).test(m.name)),
          };
        }

        specs.push(spec);
      }
    }
  }

  const timeBefore = Date.now();
  const results: Array<SpecReport<any>> = await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    specs,
    (spec: AppSpec<any>) => {
      const logs: string[] = [];
      specsLogs.push(logs);
      return runWithAppSpec(spec, message => {
        log("bot", message);
        if (process.env.CI) console.log(message);
        logs.push(message);
      }).catch(
        (fatalError): SpecReport<any> => ({
          spec,
          fatalError,
          mutations: [],
          accountsBefore: [],
          accountsAfter: [],
          hintWarnings: [],
          skipMutationsTimeoutReached: false,
        }),
      );
    },
  );
  const totalDuration = Date.now() - timeBefore;
  const allAppPaths = uniq(results.map(r => r.appPath || "").sort());
  const allAccountsAfter = flatMap(results, r => r.accountsAfter || []);
  let countervaluesError;
  const countervaluesState = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(allAccountsAfter, usd),
    autofillGaps: true,
  }).catch(e => {
    if (process.env.CI) console.error(e);
    countervaluesError = e;
    return null;
  });
  const period = "month";

  const portfolio = countervaluesState
    ? getPortfolio(allAccountsAfter, period, countervaluesState, usd)
    : null;
  const totalUSD = portfolio
    ? formatCurrencyUnit(
        usd.units[0],
        new BigNumber(portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value),
        {
          showCode: true,
        },
      )
    : "";
  const allMutationReports = flatMap(results, r => r.mutations || []);
  const mutationReports = allMutationReports.filter(r => r.mutation || r.error);
  const errorCases = allMutationReports.filter(r => r.error);
  const specFatals = results.filter(r => r.fatalError);
  const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;
  const specsWithUncoveredMutations = results
    .map(r => ({
      spec: r.spec,
      unavailableMutations: r.spec.mutations
        .map(mutation => {
          if (r.mutations && r.mutations.some(mr => mr.mutation === mutation)) {
            return;
          }

          const errors = (r.mutations || [])
            .map(mr =>
              !mr.mutation && mr.unavailableMutationReasons
                ? mr.unavailableMutationReasons.find(r => r.mutation === mutation)
                : null,
            )
            .filter(Boolean)
            .map(({ error }: any) => error);
          return {
            mutation,
            errors,
          };
        })
        .filter(Boolean),
    }))
    .filter(r => r.unavailableMutations.length > 0);
  const uncoveredMutations = flatMap(specsWithUncoveredMutations, s => s.unavailableMutations);

  if (specFatals.length && process.env.CI) {
    console.error(`================== SPEC ERRORS =====================\n`);
    specFatals.forEach(c => {
      console.error(c.fatalError);
      console.error("");
    });
  }

  if (errorCases.length && process.env.CI) {
    console.error(`================== MUTATION ERRORS =====================\n`);
    errorCases.forEach(c => {
      console.error(formatReportForConsole(c));
      console.error(c.error);
      console.error("");
    });
    console.error(
      `/!\\ ${errorCases.length} failures out of ${mutationReports.length} mutations. Check above!\n`,
    );
  }

  const specsWithoutFunds = results.filter(
    s =>
      !s.fatalError &&
      ((s.accountsBefore && s.accountsBefore.every(isAccountEmpty)) ||
        (s.mutations && s.mutations.every(r => !r.mutation))),
  );

  const fullySuccessfulSpecs = results.filter(
    s =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.every(r => !r.mutation || r.operation),
  );

  const specsWithErrors = results.filter(
    s =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.some(r => r.error || (r.mutation && !r.operation)),
  );

  const specsWithoutOperations = results.filter(
    s =>
      !s.fatalError &&
      !specsWithoutFunds.includes(s) &&
      !specsWithErrors.includes(s) &&
      s.mutations &&
      s.mutations.every(r => !r.operation),
  );

  const withoutFunds = specsWithoutFunds
    .filter(
      s =>
        // ignore coin that are backed by testnet that have funds
        !results.some(
          o =>
            o.spec.currency.isTestnetFor === s.spec.currency.id && !specsWithoutFunds.includes(o),
        ),
    )
    .map((s) => s.spec.name);
  const GITHUB_RUN_ID = getEnv("GITHUB_RUN_ID");
  const GITHUB_WORKFLOW = getEnv("GITHUB_WORKFLOW");

  let body = "";
  let githubBody = "";
  function appendBody(content) {
    body += content;
    githubBody += content;
  }
  function appendBodyFullOnly(content) {
    body += content;
  }

  let title = "";
  const runURL = `https://github.com/LedgerHQ/ledger-live/actions/runs/${String(GITHUB_RUN_ID)}`;
  const success = mutationReports.length - errorCases.length;

  if (success > 0) {
    title += `✅ ${success} txs `;
  }

  if (errorCases.length) {
    title += `❌ ${errorCases.length} txs `;
  }

  if (withoutFunds.length) {
    const msg = `💰 ${withoutFunds.length} miss funds `;
    title += msg;
  }

  if (countervaluesError) {
    title += `❌ countervalues `;
  } else {
    title += `(${totalUSD}) `;
  }

  title += `⏲ ${formatTime(totalDuration)} `;

  let subtitle = "";

  if (countervaluesError) {
    subtitle += `> ${formatError(countervaluesError)}`;
  }

  let slackBody = "";

  appendBody(`## `);
  if (GITHUB_RUN_ID && GITHUB_WORKFLOW) {
    appendBody(`[**${GITHUB_WORKFLOW}**](${runURL}) `);
  }
  appendBody(`${title}\n\n`);

  appendBody("\n\n");
  appendBody(subtitle);

  if (fullySuccessfulSpecs.length) {
    const msg = `> ✅ ${fullySuccessfulSpecs.length} specs are successful: _${fullySuccessfulSpecs
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
  }

  // slack unified message
  const slackUnified = uniq(specFatals.concat(specsWithErrors).concat(specsWithoutOperations));
  if (slackUnified.length) {
    const msg = `> ❌ ${slackUnified.length} specs have problems: _${slackUnified
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    slackBody += msg;
  }

  // PR report detailed
  if (specsWithErrors.length) {
    const msg = `> ❌ ${specsWithErrors.length} specs have problems: _${specsWithErrors
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
  }

  if (withoutFunds.length) {
    const missingFundsWarn = `> 💰 ${
      withoutFunds.length
    } specs may miss funds: _${withoutFunds.join(", ")}_\n`;
    appendBody(missingFundsWarn);
  }

  if (specsWithoutOperations.length) {
    const warn = `> ⚠️ ${
      specsWithoutOperations.length
    } specs may have issues: *${specsWithoutOperations.map(o => o.spec.name).join(", ")}*\n`;
    appendBody(warn);
  }

  appendBody(
    "\n> What is the bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n",
  );

  appendBody("\n\n");

  if (specFatals.length) {
    appendBody("<details>\n");
    appendBody(`<summary>${specFatals.length} critical spec errors</summary>\n\n`);
    specFatals.forEach(({ spec, fatalError }) => {
      appendBody(`**Spec ${spec.name} failed!**\n`);
      appendBody("```\n" + formatError(fatalError, true) + "\n```\n\n");
    });
    appendBody("</details>\n\n");
  }

  // summarize the error causes
  const dedupedErrorCauses: string[] = [];
  errorCases.forEach(m => {
    if (!m.error) return;
    const ctx = getContext(m.error);
    if (!ctx) return;
    const cause = m.spec.name + " > " + ctx;
    if (!dedupedErrorCauses.includes(cause)) {
      dedupedErrorCauses.push(cause);
    }
  });

  if (errorCases.length) {
    appendBody("<details>\n");
    appendBody(`<summary>❌ ${errorCases.length} mutation errors</summary>\n\n`);
    errorCases.forEach(c => {
      appendBody("```\n" + formatReportForConsole(c) + "\n```\n\n");
    });
    appendBody("</details>\n\n");
  }

  const specWithWarnings = results.filter(s => s.hintWarnings.length > 0);
  if (specWithWarnings.length > 0) {
    appendBody("<details>\n");
    appendBody(
      `<summary>⚠️ ${specWithWarnings.reduce(
        (sum, s) => s.hintWarnings.length + sum,
        0,
      )} spec hints</summary>\n\n`,
    );
    specWithWarnings.forEach(s => {
      appendBody(`- Spec ${s.spec.name}:\n`);
      s.hintWarnings.forEach(txt => appendBody(`  - ${txt}\n`));
    });
    appendBody("</details>\n\n");
  }

  appendBodyFullOnly("<details>\n");

  appendBodyFullOnly(`<summary>Details of the ${mutationReports.length} mutations</summary>\n\n`);
  results.forEach((r, i) => {
    const spec = specs[i];
    const logs = specsLogs[i];
    appendBodyFullOnly(`#### Spec ${spec.name} (${r.mutations ? r.mutations.length : "failed"})\n`);
    appendBodyFullOnly("\n```\n");
    appendBodyFullOnly(logs.join("\n"));

    if (r.mutations) {
      r.mutations.forEach(m => {
        if (m.error || m.mutation) {
          appendBodyFullOnly(formatReportForConsole(m) + "\n");
        }
      });
    }

    appendBodyFullOnly("\n```\n");
  });
  appendBodyFullOnly("</details>\n\n");

  if (uncoveredMutations.length > 0) {
    appendBodyFullOnly("<details>\n");
    appendBodyFullOnly(
      `<summary>Details of the ${uncoveredMutations.length} uncovered mutations</summary>\n\n`,
    );
    specsWithUncoveredMutations.forEach(({ spec, unavailableMutations }) => {
      appendBodyFullOnly(`#### Spec ${spec.name} (${unavailableMutations.length})\n`);
      unavailableMutations.forEach(m => {
        // FIXME: we definitely got to stop using Maybe types or | undefined | null
        if (!m) return;
        const msgs = groupBy(m.errors.map(e => e.message));
        appendBodyFullOnly(
          "- **" +
            m.mutation.name +
            "**: " +
            Object.keys(msgs)
              .map(msg => `${msg} (${msgs[msg].length})`)
              .join(", ") +
            "\n",
        );
      });
    });
    appendBodyFullOnly("</details>\n\n");
  }

  appendBody("<details>\n");
  appendBody(
    `<summary>Portfolio ${totalUSD ? " (" + totalUSD + ")" : ""} – Details of the ${
      results.length
    } currencies</summary>\n\n`,
  );
  appendBody("| Spec (accounts) | State | Remaining Runs (est) | funds? |\n");
  appendBody("|-----------------|-------|----------------------|--------|\n");
  results.forEach(r => {
    function sumAccounts(all) {
      if (!all || all.length === 0) return;
      return all.reduce((sum, a) => sum.plus(a.spendableBalance), new BigNumber(0));
    }

    const { accountsBefore } = r;

    const accountsBeforeBalance = sumAccounts(accountsBefore);
    let balance = !accountsBeforeBalance
      ? "🤷‍♂️"
      : "**" +
        formatCurrencyUnit(r.spec.currency.units[0], accountsBeforeBalance, {
          showCode: true,
        }) +
        "**";

    let eta = 0;
    let etaEmoji = "❌";
    const accounts = r.accountsAfter || r.accountsBefore || [];
    const operations = flatMap(accounts, a => a.operations).sort((a, b) =>
      a.fee.minus(b.fee).toNumber(),
    );
    const avgOperationFee = operations
      .reduce((sum, o) => sum.plus(o.fee || 0), new BigNumber(0))
      .div(operations.length);
    // const medianOperation = operations[Math.floor(operations.length / 2)];
    const maxRuns = r.spec.mutations.reduce((sum, m) => sum + m.maxRun || 1, 0);
    if (avgOperationFee.gt(0) && maxRuns > 0) {
      const spendableBalanceSum = accounts.reduce(
        (sum, a) =>
          sum.plus(BigNumber.max(a.spendableBalance.minus(r.spec.minViableAmount || 0), 0)),
        new BigNumber(0),
      );
      eta = spendableBalanceSum.div(avgOperationFee).div(maxRuns).toNumber();
      etaEmoji = eta < 50 ? "⚠️" : eta < 500 ? "👍" : "💪";
    }

    if (countervaluesState && r.accountsAfter) {
      const portfolio = getPortfolio(r.accountsAfter, period, countervaluesState, usd);
      const totalUSD = portfolio
        ? formatCurrencyUnit(
            usd.units[0],
            new BigNumber(portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value),
            {
              showCode: true,
            },
          )
        : "";
      balance += " (" + totalUSD + ")";
    }

    function countOps(all) {
      if (!all) return 0;
      return all.reduce((sum, a) => sum + a.operations.length, 0);
    }

    const beforeOps = countOps(r.accountsBefore);
    const afterOps = countOps(r.accountsAfter);
    const firstAccount = accounts[0];
    appendBody(`| ${r.spec.name} (${accounts.length}) `);
    appendBody(
      `| ${afterOps || beforeOps} ops ${
        afterOps > beforeOps ? ` (+${afterOps - beforeOps})` : ""
      }, ${balance} `,
    );
    appendBody(`| ${etaEmoji} ${!eta ? "" : eta > 999 ? "999+" : Math.round(eta)} `);
    appendBody(`| \`${(firstAccount && firstAccount.freshAddress) || ""}\` `);
    appendBody("|\n");
  });

  const BOT_REPORT_FOLDER = getEnv("BOT_REPORT_FOLDER");
  appendBody("\n```\n");
  appendBody(allAccountsAfter.map(a => formatAccount(a, "head")).join("\n"));
  appendBody("\n```\n");

  appendBody("\n</details>\n\n");

  // Add performance details
  appendBody("<details>\n");
  appendBody(`<summary>Performance ⏲ ${formatTime(totalDuration)}</summary>\n\n`);
  appendBody("**Time spent for each spec:** (total across mutations)\n");

  function sumMutation(mutations, f) {
    return mutations?.reduce((sum, m) => sum + (f(m) || 0), 0) || 0;
  }
  function sumResults(f) {
    return results.reduce((sum, r) => sum + (f(r) || 0), 0);
  }
  function sumResultsMutation(f) {
    return sumResults(r => sumMutation(r.mutations, f));
  }

  appendBody(
    "| Spec (accounts) | preload | scan | re-sync | tx status | sign op | broadcast | test | destination test |\n",
  );
  appendBody("|---|---|---|---|---|---|---|---|---|\n");

  appendBody("| **TOTAL** |");
  appendBody(`**${formatTime(sumResults(r => r.preloadDuration))}** |`);
  appendBody(`**${formatTime(sumResults(r => r.scanDuration))}** |`);
  appendBody(`**${formatTime(sumResultsMutation(m => m.resyncAccountsDuration || 0))}** |`);
  appendBody(
    `**${formatTime(
      sumResultsMutation(m => (m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0)),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m => (m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0)),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m =>
        m.signedTime && m.broadcastedTime ? m.broadcastedTime - m.signedTime : 0,
      ),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m =>
        m.broadcastedTime && m.confirmedTime ? m.confirmedTime - m.broadcastedTime : 0,
      ),
    )}** |`,
  );
  appendBody(`**${formatTime(sumResultsMutation(m => m.testDestinationDuration || 0))}** |\n`);

  results.forEach(r => {
    const accounts = r.accountsAfter || r.accountsBefore || [];
    appendBody(`| ${r.spec.name} (${accounts.filter(a => a.used).length}) |`);
    appendBody(`${formatTime(r.preloadDuration || 0)} |`);
    appendBody(`${formatTime(r.scanDuration || 0)} |`);
    appendBody(`${formatTime(sumMutation(r.mutations, m => m.resyncAccountsDuration || 0))} |`);
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.signedTime && m.broadcastedTime ? m.broadcastedTime - m.signedTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.broadcastedTime && m.confirmedTime ? m.confirmedTime - m.broadcastedTime : 0,
        ),
      )} |`,
    );
    appendBody(`${formatTime(sumMutation(r.mutations, m => m.testDestinationDuration || 0))} |\n`);
  });

  appendBody("\n</details>\n\n");

  appendBody(
    "\n> What is the bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n",
  );

  let complementary = "";
  const { GITHUB_REF_NAME, GITHUB_ACTOR } = process.env;
  if (GITHUB_REF_NAME !== "develop") {
    complementary = `:pr: by *${GITHUB_ACTOR}* on \`${GITHUB_REF_NAME}\` `;
  }

  const slackCommentTemplate = `${String(
    GITHUB_WORKFLOW,
  )} ${complementary}(<{{url}}|details> – <${runURL}|logs>)\n${title}\n${slackBody}`;

  await botReportFolder({
    BOT_REPORT_FOLDER,
    body,
    slackCommentTemplate,
    allAccountsAfter,
    results,
    allAppPaths,
    githubBody
  });


  if (botHaveFailed) {
    let txt = "";
    specFatals.forEach(({ spec, fatalError }) => {
      txt += `${spec.name} got ${String(fatalError)}\n`;
    });
    errorCases.forEach((c: MutationReport<any>) => {
      txt += `in ${c.spec.name}`;
      if (c.account) txt += `/${c.account.name}`;
      if (c.mutation) txt += `/${c.mutation.name}`;
      txt += ` got ${String(c.error)}\n`;
    });
    // throw new Error(txt);
    console.error(txt);
  }
}
