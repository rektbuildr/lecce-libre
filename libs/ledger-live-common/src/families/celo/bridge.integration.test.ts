import "../../__tests__/test-helpers/setup";

import celo from "./datasets/celo.scanAccounts.1";
import type { Transaction } from "./types";
import type { DatasetTest } from "@ledgerhq/types-live";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    celo,
  },
};


