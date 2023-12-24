import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { RampCatalog } from "../types";
import mockData from "./mock.json";

const api = {
  fetchRampCatalog: async (): Promise<RampCatalog> => {
    return {} as RampCatalog;
  },
};

export default api;
