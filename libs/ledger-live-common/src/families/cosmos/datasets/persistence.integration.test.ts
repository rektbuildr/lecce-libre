import { DatasetTest } from "@ledgerhq/types-live";

import "../../../__tests__/test-helpers/setup";
import persistence from "./persistence";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    persistence,
  },
};


