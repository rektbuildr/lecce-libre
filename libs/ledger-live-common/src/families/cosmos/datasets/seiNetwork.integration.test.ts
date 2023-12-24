import { DatasetTest } from "@ledgerhq/types-live";

import "../../../__tests__/test-helpers/setup";
import sei_network from "./seiNetwork";
import type { Transaction } from "../types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    sei_network,
  },
};


