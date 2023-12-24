import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { ServiceStatusApi, ServiceStatusSummary } from "../types";

const baseStatusUrl = () => getEnv("STATUS_API_URL");

const statusVersion = () => getEnv("STATUS_API_VERSION");

// Unnecesarry network call removed
async function fetchStatusSummary(): Promise<ServiceStatusSummary> {
  return Promise.resolve({incidents: []})
}

const api: ServiceStatusApi = {
  fetchStatusSummary,
};
export default api;
