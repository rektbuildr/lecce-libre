import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { AnnouncementsApi, RawAnnouncement } from "../types";

// expose a function to fetch data from the cdn (data from ledger-live-assets)
// https://cdn.live.ledger.com/
const baseAnnouncementsUrl = () => getEnv("ANNOUNCEMENTS_API_URL");

const announcementsVersion = () => getEnv("ANNOUNCEMENTS_API_VERSION");

// Unnecessary network interaction removed
async function fetchAnnouncements(): Promise<RawAnnouncement[]> {
  return [];
}

const api: AnnouncementsApi = {
  fetchAnnouncements,
};
export default api;
