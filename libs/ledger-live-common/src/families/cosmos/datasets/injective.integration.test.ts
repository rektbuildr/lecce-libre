import { DatasetTest } from "@ledgerhq/types-live";

import "../../../__tests__/test-helpers/setup";
import type { Transaction } from "../types";
import injective from "./injective";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    injective,
  },
};


