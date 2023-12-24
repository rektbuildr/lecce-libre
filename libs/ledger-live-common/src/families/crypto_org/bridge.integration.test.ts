import "../../__tests__/test-helpers/setup";

import type { Transaction } from "./types";
import crypto_org_croeseid from "./datasets/croeseid";
import type { DatasetTest } from "@ledgerhq/types-live";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    crypto_org_croeseid,
  },
};


