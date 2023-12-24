import { DatasetTest } from "@ledgerhq/types-live";

import "../../../__tests__/test-helpers/setup";
import osmosis from "./osmosis";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    osmosis,
  },
};


