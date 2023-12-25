/* eslint-disable camelcase */
import {
  DeviceOnDashboardExpected,
  FirmwareNotRecognized,
  ManagerAppAlreadyInstalledError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  NetworkDown,
  TransportStatusError,
  UserRefusedFirmwareUpdate,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import {
  App,
  Application,
  ApplicationV2,
  ApplicationVersion,
  Category,
  DeviceInfo,
  DeviceVersion,
  FinalFirmware,
  Id,
  LanguagePackage,
  LanguagePackageResponse,
  McuVersion,
  OsuFirmware,
  SocketEvent,
} from "@ledgerhq/types-live";
import invariant from "invariant";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import semver from "semver";
import URL from "url";
import { version as livecommonversion } from "../../package.json";
import { mapApplicationV2ToApp } from "../apps/polyfill";
import { getEnv } from "@ledgerhq/live-env";
import { createDeviceSocket } from "../socket";
import {
  bulkSocketMock,
  createMockSocket,
  resultMock,
  secureChannelMock,
} from "../socket/socket.mock";
import { getUserHashes } from "../user";
import { getProviderId } from "./provider";

declare global {
  namespace NodeJS {
    interface Global {
      _listInstalledApps_mock_result: any;
    }
  }
}

const remapSocketError = (context?: string) =>
  catchError((e: Error) => {
    if (!e || !e.message) return throwError(() => e);

    if (e.message.startsWith("invalid literal")) {
      // hack to detect the case you're not in good condition (not in dashboard)
      return throwError(() => new DeviceOnDashboardExpected());
    }

    const status =
      e instanceof TransportStatusError
        ? e.statusCode.toString(16)
        : (e as Error).message.slice((e as Error).message.length - 4);

    // TODO use StatusCode instead of this.
    switch (status) {
      case "6a80":
      case "6a81":
      case "6a8e":
      case "6a8f":
        return throwError(() => new ManagerAppAlreadyInstalledError());

      case "6982":
      case "5303":
        return throwError(() => new ManagerDeviceLockedError());

      case "6a84":
      case "5103":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new ManagerFirmwareNotEnoughSpaceError());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      case "6a85":
      case "5102":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new UserRefusedFirmwareUpdate());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      case "6985":
      case "5501":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new UserRefusedFirmwareUpdate());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      default:
        return throwError(() => e);
    }
  });

const applicationsByDevice: (params: {
  provider: number;
  current_se_firmware_final_version: Id;
  device_version: Id;
}) => Promise<Array<ApplicationVersion>> = makeLRUCache(
  async params => {
    const r = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_apps`,
        query: {
          livecommonversion,
        },
      }),
      data: params,
    });
    return r.data.application_versions;
  },
  p =>
    `${getEnv("MANAGER_API_BASE")}_${p.provider}_${p.current_se_firmware_final_version}_${
      p.device_version
    }`,
);

/**
 * Return a list of App that are available for a given firmware version on a provider.
 * Prevents the call to ManagerAPI.listApps which includes all versions of all apps and
 * was causing slower access to the manager.
 */
const catalogForDevice: (params: {
  provider: number;
  targetId: number | string;
  firmwareVersion: string;
}) => Promise<Array<App>> = makeLRUCache(
  async params => {
    const { provider, targetId, firmwareVersion } = params;
    const {
      data,
    }: {
      data: Array<ApplicationV2>;
    } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/v2/apps/by-target`,
        query: {
          livecommonversion,
          provider,
          target_id: targetId,
          firmware_version_name: firmwareVersion,
        },
      }),
    });

    if (!data || !Array.isArray(data)) {
      throw new NetworkDown("");
    }

    return data.map(mapApplicationV2ToApp);
  },
  a => `${getEnv("MANAGER_API_BASE")}_${a.provider}_${a.targetId}_${a.firmwareVersion}`,
);

const listApps: () => Promise<Array<Application>> = makeLRUCache(
  async () => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/applications`,
        query: {
          livecommonversion,
        },
      }),
    });

    if (!data || !Array.isArray(data)) {
      throw new NetworkDown("");
    }

    return data;
  },
  () => getEnv("MANAGER_API_BASE"),
);

const listCategories = async (): Promise<Array<Category>> => {
  const r = await network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("MANAGER_API_BASE")}/categories`,
      query: {
        livecommonversion,
      },
    }),
  });
  return r.data;
};

const getMcus: () => Promise<any> = makeLRUCache(
  async () => {
    return [
      {
          "id": 1,
          "mcu": 1,
          "name": "1.0",
          "description": null,
          "providers": [],
          "device_versions": [
              1,
              2
          ],
          "from_bootloader_version": "",
          "from_bootloader_version_id": 2,
          "se_firmware_final_versions": [
              7,
              12,
              13,
              14,
              15
          ],
          "date_creation": "2018-09-20T13:30:50.156394Z",
          "date_last_modified": "2018-09-20T13:30:50.156453Z"
      },
      {
          "id": 2,
          "mcu": 1,
          "name": "1.1",
          "description": null,
          "providers": [],
          "device_versions": [
              1,
              2
          ],
          "from_bootloader_version": "",
          "from_bootloader_version_id": 2,
          "se_firmware_final_versions": [
              7,
              12,
              13,
              14,
              15
          ],
          "date_creation": "2018-09-20T13:30:50.339966Z",
          "date_last_modified": "2018-09-20T13:30:50.340031Z"
      },
      {
          "id": 3,
          "mcu": 1,
          "name": "1.5",
          "description": "",
          "providers": [
              1,
              2,
              9,
              11,
              12
          ],
          "device_versions": [
              6,
              10
          ],
          "from_bootloader_version": "0.6.0",
          "from_bootloader_version_id": 41,
          "se_firmware_final_versions": [
              9,
              10,
              11,
              20
          ],
          "date_creation": "2018-09-20T13:30:50.580138Z",
          "date_last_modified": "2023-06-26T16:01:46.972104Z"
      },
      {
          "id": 4,
          "mcu": 1,
          "name": "0.6",
          "description": "",
          "providers": [
              1
          ],
          "device_versions": [
              6
          ],
          "from_bootloader_version": "0.0.0",
          "from_bootloader_version_id": 3,
          "se_firmware_final_versions": [],
          "date_creation": "2018-09-20T13:30:50.732513Z",
          "date_last_modified": "2019-09-04T15:11:17.582138Z"
      },
      {
          "id": 6,
          "mcu": 1,
          "name": "1.7",
          "description": "",
          "providers": [
              1,
              4,
              11,
              12,
              13
          ],
          "device_versions": [
              10
          ],
          "from_bootloader_version": "0.9.0",
          "from_bootloader_version_id": 16,
          "se_firmware_final_versions": [
              22,
              24,
              27
          ],
          "date_creation": "2018-12-11T13:33:52.558800Z",
          "date_last_modified": "2023-06-26T16:01:58.366811Z"
      },
      {
          "id": 8,
          "mcu": 1,
          "name": "1.5",
          "description": "",
          "providers": [],
          "device_versions": [
              2,
              6
          ],
          "from_bootloader_version": "0.6",
          "from_bootloader_version_id": 11,
          "se_firmware_final_versions": [
              10,
              11,
              20
          ],
          "date_creation": "2019-01-02T16:38:00.705933Z",
          "date_last_modified": "2020-11-20T16:52:08.286929Z"
      },
      {
          "id": 9,
          "mcu": 1,
          "name": "1.6",
          "description": "",
          "providers": [
              9,
              12
          ],
          "device_versions": [
              6,
              9
          ],
          "from_bootloader_version": "0.7",
          "from_bootloader_version_id": 23,
          "se_firmware_final_versions": [
              9,
              10,
              11,
              27,
              50,
              63
          ],
          "date_creation": "2019-01-10T09:10:34.079759Z",
          "date_last_modified": "2021-04-28T13:48:01.087941Z"
      },
      {
          "id": 13,
          "mcu": 1,
          "name": "1.4",
          "description": "",
          "providers": [],
          "device_versions": [
              6
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              10,
              11
          ],
          "date_creation": "2019-02-18T13:54:17.509386Z",
          "date_last_modified": "2020-11-20T16:52:26.358720Z"
      },
      {
          "id": 14,
          "mcu": 2,
          "name": "1.8",
          "description": "",
          "providers": [
              1,
              4
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              28
          ],
          "date_creation": "2019-02-20T10:24:51.051580Z",
          "date_last_modified": "2019-02-20T10:24:51.051651Z"
      },
      {
          "id": 15,
          "mcu": 2,
          "name": "2.5-nordp2",
          "description": "",
          "providers": [
              1,
              4
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "rien",
          "from_bootloader_version_id": 5,
          "se_firmware_final_versions": [
              33,
              34
          ],
          "date_creation": "2019-04-11T11:47:01.484200Z",
          "date_last_modified": "2019-04-11T11:47:01.484236Z"
      },
      {
          "id": 16,
          "mcu": 2,
          "name": "2.6-norpd2-dev",
          "description": "",
          "providers": [
              1,
              4
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "noneee",
          "from_bootloader_version_id": 6,
          "se_firmware_final_versions": [
              36
          ],
          "date_creation": "2019-04-16T12:51:18.282875Z",
          "date_last_modified": "2019-04-16T12:51:18.282954Z"
      },
      {
          "id": 17,
          "mcu": 2,
          "name": "2.8",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12,
              13
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              38,
              39,
              40,
              41,
              42,
              109
          ],
          "date_creation": "2019-04-25T12:45:02.020818Z",
          "date_last_modified": "2021-05-03T13:43:11.645931Z"
      },
      {
          "id": 18,
          "mcu": 4,
          "name": "2.5-hw1",
          "description": "",
          "providers": [
              1,
              4
          ],
          "device_versions": [
              7,
              11
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              3,
              15,
              43,
              44,
              46,
              47,
              48,
              49,
              51,
              52,
              55
          ],
          "date_creation": "2019-05-24T14:00:27.056075Z",
          "date_last_modified": "2019-07-02T08:37:01.358121Z"
      },
      {
          "id": 19,
          "mcu": 5,
          "name": "3.4-hw15",
          "description": "blue_mcu34blup",
          "providers": [
              1,
              4,
              5,
              7,
              12,
              14
          ],
          "device_versions": [
              8,
              12
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              15,
              43,
              44,
              46,
              47,
              48,
              49,
              51,
              52,
              53,
              54,
              55,
              56,
              57,
              58,
              59,
              64,
              65,
              68,
              69,
              75,
              76,
              77,
              78,
              79,
              80,
              81,
              82,
              83,
              84,
              85,
              86,
              87,
              88,
              89,
              91,
              92,
              93,
              94,
              95,
              97,
              104,
              105,
              106,
              119,
              205,
              206,
              207,
              208,
              328,
              329,
              330,
              331
          ],
          "date_creation": "2019-05-24T14:10:04.775390Z",
          "date_last_modified": "2023-09-14T16:30:39.005165Z"
      },
      {
          "id": 20,
          "mcu": 5,
          "name": "blue_mcu34seph",
          "description": "",
          "providers": [
              1,
              4,
              5,
              7,
              12,
              14
          ],
          "device_versions": [
              8,
              12
          ],
          "from_bootloader_version": "3.4-hw15",
          "from_bootloader_version_id": 14,
          "se_firmware_final_versions": [
              4
          ],
          "date_creation": "2019-05-24T14:10:32.773119Z",
          "date_last_modified": "2020-11-25T09:51:00.203344Z"
      },
      {
          "id": 21,
          "mcu": 4,
          "name": "blue_mcu25seph",
          "description": "",
          "providers": [
              1,
              4
          ],
          "device_versions": [
              7,
              11
          ],
          "from_bootloader_version": "2.5-hw1",
          "from_bootloader_version_id": 8,
          "se_firmware_final_versions": [
              3
          ],
          "date_creation": "2019-05-24T14:11:19.197877Z",
          "date_last_modified": "2019-05-24T14:12:19.586007Z"
      },
      {
          "id": 22,
          "mcu": 1,
          "name": "1.8",
          "description": "",
          "providers": [
              4
          ],
          "device_versions": [
              10
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              50,
              63
          ],
          "date_creation": "2019-08-05T09:51:30.079900Z",
          "date_last_modified": "2019-10-07T15:12:07.166449Z"
      },
      {
          "id": 23,
          "mcu": 1,
          "name": "1.11",
          "description": "",
          "providers": [
              1,
              2,
              4,
              7,
              9,
              12
          ],
          "device_versions": [
              10
          ],
          "from_bootloader_version": "0.11",
          "from_bootloader_version_id": 22,
          "se_firmware_final_versions": [
              37,
              67
          ],
          "date_creation": "2019-10-17T14:07:25.552300Z",
          "date_last_modified": "2021-04-28T13:47:10.150953Z"
      },
      {
          "id": 24,
          "mcu": 1,
          "name": "1.12",
          "description": "",
          "providers": [
              1,
              7,
              12
          ],
          "device_versions": [
              10
          ],
          "from_bootloader_version": "0.11",
          "from_bootloader_version_id": 22,
          "se_firmware_final_versions": [
              67,
              108,
              113,
              118,
              124,
              125,
              126,
              127,
              128,
              129,
              142,
              143,
              146,
              149
          ],
          "date_creation": "2020-01-23T16:20:53.955860Z",
          "date_last_modified": "2021-11-29T13:54:53.448387Z"
      },
      {
          "id": 27,
          "mcu": 2,
          "name": "2.10",
          "description": "",
          "providers": [
              1,
              4,
              7,
              9,
              12,
              16
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.4",
          "from_bootloader_version_id": 20,
          "se_firmware_final_versions": [
              109,
              110,
              111,
              112,
              115,
              116,
              117,
              121,
              122,
              123,
              130,
              131
          ],
          "date_creation": "2020-07-07T08:23:56.191811Z",
          "date_last_modified": "2021-04-27T20:16:49.018743Z"
      },
      {
          "id": 28,
          "mcu": 2,
          "name": "2.9-rc1",
          "description": "",
          "providers": [
              4,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.4",
          "from_bootloader_version_id": 20,
          "se_firmware_final_versions": [
              109,
              110,
              111,
              112
          ],
          "date_creation": "2020-07-07T11:15:11.254721Z",
          "date_last_modified": "2020-07-07T12:03:33.015906Z"
      },
      {
          "id": 30,
          "mcu": 2,
          "name": "2.12",
          "description": "New battery charger L6925D",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              130,
              131
          ],
          "date_creation": "2021-04-01T10:06:34.210061Z",
          "date_last_modified": "2021-04-27T21:45:21.929035Z"
      },
      {
          "id": 32,
          "mcu": 2,
          "name": "2.22",
          "description": "New PCB 2.x",
          "providers": [
              1,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.15",
          "from_bootloader_version_id": 33,
          "se_firmware_final_versions": [
              136
          ],
          "date_creation": "2021-08-17T06:09:55.288047Z",
          "date_last_modified": "2021-09-16T16:44:37.749308Z"
      },
      {
          "id": 33,
          "mcu": 8,
          "name": "4.00",
          "description": "Testing",
          "providers": [
              1,
              7,
              12
          ],
          "device_versions": [
              16
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": 25,
          "se_firmware_final_versions": [
              137,
              147
          ],
          "date_creation": "2021-09-14T07:58:09.397810Z",
          "date_last_modified": "2021-11-04T09:37:29.085434Z"
      },
      {
          "id": 34,
          "mcu": 2,
          "name": "2.20",
          "description": "",
          "providers": [
              1,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.10",
          "from_bootloader_version_id": 34,
          "se_firmware_final_versions": [
              133
          ],
          "date_creation": "2021-09-16T16:43:18.854713Z",
          "date_last_modified": "2021-09-16T16:45:26.942096Z"
      },
      {
          "id": 35,
          "mcu": 2,
          "name": "2.21",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.20",
          "from_bootloader_version_id": 38,
          "se_firmware_final_versions": [
              135
          ],
          "date_creation": "2021-09-16T16:46:40.463288Z",
          "date_last_modified": "2021-10-15T15:01:17.781252Z"
      },
      {
          "id": 36,
          "mcu": 2,
          "name": "2.27",
          "description": "",
          "providers": [
              1,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.16",
          "from_bootloader_version_id": 39,
          "se_firmware_final_versions": [
              139
          ],
          "date_creation": "2021-10-01T12:19:01.846057Z",
          "date_last_modified": "2021-10-05T12:11:10.210652Z"
      },
      {
          "id": 37,
          "mcu": 2,
          "name": "2.28",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.16",
          "from_bootloader_version_id": 39,
          "se_firmware_final_versions": [
              139,
              140,
              144,
              145
          ],
          "date_creation": "2021-10-15T15:08:30.990459Z",
          "date_last_modified": "2021-12-13T08:05:54.410705Z"
      },
      {
          "id": 38,
          "mcu": 8,
          "name": "4.01",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              16
          ],
          "from_bootloader_version": "3.11",
          "from_bootloader_version_id": 28,
          "se_firmware_final_versions": [
              148,
              154,
              155
          ],
          "date_creation": "2021-11-25T15:09:51.216346Z",
          "date_last_modified": "2022-02-11T08:31:17.513067Z"
      },
      {
          "id": 39,
          "mcu": 2,
          "name": "2.29",
          "description": "",
          "providers": [
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.16",
          "from_bootloader_version_id": 39,
          "se_firmware_final_versions": [
              150
          ],
          "date_creation": "2021-12-10T11:31:22.660038Z",
          "date_last_modified": "2021-12-13T08:01:00.636564Z"
      },
      {
          "id": 40,
          "mcu": 2,
          "name": "2.30",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.16",
          "from_bootloader_version_id": 39,
          "se_firmware_final_versions": [
              151,
              161,
              169,
              170,
              229,
              230,
              232,
              241,
              245,
              250,
              253,
              263,
              268,
              277,
              281,
              288,
              289,
              292,
              299,
              305,
              316,
              323,
              327
          ],
          "date_creation": "2022-01-12T10:02:49.629717Z",
          "date_last_modified": "2023-09-11T13:43:37.663842Z"
      },
      {
          "id": 45,
          "mcu": 8,
          "name": "4.02",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              16
          ],
          "from_bootloader_version": "3.12",
          "from_bootloader_version_id": 31,
          "se_firmware_final_versions": [
              158,
              159,
              160,
              163,
              183,
              194,
              233
          ],
          "date_creation": "2022-02-21T16:25:19.781466Z",
          "date_last_modified": "2022-08-10T12:34:09.949689Z"
      },
      {
          "id": 46,
          "mcu": 9,
          "name": "2.30",
          "description": "LNX mockup",
          "providers": [
              11
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "1.16",
          "from_bootloader_version_id": 39,
          "se_firmware_final_versions": [
              162,
              164
          ],
          "date_creation": "2022-03-22T08:53:05.725455Z",
          "date_last_modified": "2022-04-06T15:51:54.980304Z"
      },
      {
          "id": 47,
          "mcu": 9,
          "name": "0.01",
          "description": "",
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.01",
          "from_bootloader_version_id": 35,
          "se_firmware_final_versions": [
              165
          ],
          "date_creation": "2022-04-06T15:57:53.244028Z",
          "date_last_modified": "2022-04-06T16:13:31.616024Z"
      },
      {
          "id": 48,
          "mcu": 9,
          "name": "0.20",
          "description": "",
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.20",
          "from_bootloader_version_id": 36,
          "se_firmware_final_versions": [
              166
          ],
          "date_creation": "2022-04-06T16:07:57.613750Z",
          "date_last_modified": "2022-04-06T16:14:33.822733Z"
      },
      {
          "id": 57,
          "mcu": 9,
          "name": "2.90",
          "description": "LNX mockup + BLE",
          "providers": [
              10,
              11,
              12,
              13
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "1.90",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              178,
              200,
              201
          ],
          "date_creation": "2022-05-12T11:03:33.679730Z",
          "date_last_modified": "2022-06-27T09:36:42.529807Z"
      },
      {
          "id": 84,
          "mcu": 8,
          "name": "4.03",
          "description": "",
          "providers": [
              1,
              4,
              7,
              10,
              11,
              12
          ],
          "device_versions": [
              16
          ],
          "from_bootloader_version": "3.12",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              213,
              222,
              231,
              233,
              236,
              242,
              244,
              246,
              251,
              254,
              264,
              267,
              278,
              282,
              318,
              336,
              338
          ],
          "date_creation": "2022-06-21T17:05:55.290349Z",
          "date_last_modified": "2023-12-11T14:06:47.113507Z"
      },
      {
          "id": 90,
          "mcu": 9,
          "name": "2.91",
          "description": "LNX mockup + BLE",
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "1.90",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              219
          ],
          "date_creation": "2022-06-27T08:50:23.824411Z",
          "date_last_modified": "2022-06-27T08:51:15.332895Z"
      },
      {
          "id": 91,
          "mcu": 9,
          "name": "2.92",
          "description": "LNX mockup + BLE",
          "providers": [
              13
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "1.91",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              220
          ],
          "date_creation": "2022-06-27T08:53:19.551253Z",
          "date_last_modified": "2022-06-27T08:53:35.915735Z"
      },
      {
          "id": 99,
          "mcu": 9,
          "name": "5.2",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "none",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              234,
              235,
              238,
              240,
              243
          ],
          "date_creation": "2022-09-14T14:16:55.125012Z",
          "date_last_modified": "2022-10-25T11:15:37.258874Z"
      },
      {
          "id": 100,
          "mcu": 9,
          "name": "5.4",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.31",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              235,
              237,
              238,
              239
          ],
          "date_creation": "2022-10-04T16:34:03.565795Z",
          "date_last_modified": "2022-10-06T09:42:12.447303Z"
      },
      {
          "id": 101,
          "mcu": 9,
          "name": "5.5",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.32",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              247
          ],
          "date_creation": "2022-11-09T16:08:24.410054Z",
          "date_last_modified": "2022-11-10T09:53:00.231341Z"
      },
      {
          "id": 102,
          "mcu": 9,
          "name": "5.7",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.34",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              248,
              249
          ],
          "date_creation": "2022-11-29T09:15:17.076954Z",
          "date_last_modified": "2022-12-02T15:45:48.500155Z"
      },
      {
          "id": 103,
          "mcu": 9,
          "name": "5.6",
          "description": "",
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.33",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              247,
              252
          ],
          "date_creation": "2022-11-29T12:30:55.078893Z",
          "date_last_modified": "2022-12-07T14:44:08.293760Z"
      },
      {
          "id": 104,
          "mcu": 9,
          "name": "5.8",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.35",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              252
          ],
          "date_creation": "2022-12-02T14:22:26.536250Z",
          "date_last_modified": "2022-12-02T15:45:18.143664Z"
      },
      {
          "id": 105,
          "mcu": 9,
          "name": "5.9",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.36",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              255,
              269
          ],
          "date_creation": "2022-12-15T12:46:18.393980Z",
          "date_last_modified": "2023-01-26T15:49:37.772071Z"
      },
      {
          "id": 108,
          "mcu": 9,
          "name": "5.10",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.37",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              258
          ],
          "date_creation": "2023-01-12T10:07:58.367098Z",
          "date_last_modified": "2023-01-12T10:09:46.210229Z"
      },
      {
          "id": 112,
          "mcu": 9,
          "name": "5.90",
          "description": "Infinite update",
          "providers": [
              10,
              11,
              12,
              13,
              16
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.90",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              270,
              271
          ],
          "date_creation": "2023-01-26T16:39:34.943997Z",
          "date_last_modified": "2023-02-08T14:15:53.226061Z"
      },
      {
          "id": 113,
          "mcu": 9,
          "name": "5.91",
          "description": "Infinite update",
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.90",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              272
          ],
          "date_creation": "2023-01-26T16:39:58.499383Z",
          "date_last_modified": "2023-01-26T17:59:08.861172Z"
      },
      {
          "id": 114,
          "mcu": 9,
          "name": "5.92",
          "description": "Infinite update",
          "providers": [
              13,
              16
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.91",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              273
          ],
          "date_creation": "2023-01-26T16:41:35.804720Z",
          "date_last_modified": "2023-04-19T11:55:26.150894Z"
      },
      {
          "id": 117,
          "mcu": 9,
          "name": "5.14",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.39",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              276
          ],
          "date_creation": "2023-02-09T14:27:50.917430Z",
          "date_last_modified": "2023-02-09T14:27:56.266582Z"
      },
      {
          "id": 119,
          "mcu": 9,
          "name": "5.15",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.40",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              280,
              283
          ],
          "date_creation": "2023-03-03T09:51:55.622356Z",
          "date_last_modified": "2023-03-16T08:19:12.428528Z"
      },
      {
          "id": 124,
          "mcu": 9,
          "name": "5.16",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.41",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              290,
              291,
              293,
              294,
              295,
              296
          ],
          "date_creation": "2023-03-30T08:27:41.637978Z",
          "date_last_modified": "2023-04-11T09:56:52.016122Z"
      },
      {
          "id": 125,
          "mcu": 9,
          "name": "5.17",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.42",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              296,
              297,
              298
          ],
          "date_creation": "2023-04-11T14:56:25.150210Z",
          "date_last_modified": "2023-04-13T09:20:19.362363Z"
      },
      {
          "id": 126,
          "mcu": 9,
          "name": "5.93",
          "description": "Infinite update",
          "providers": [
              10,
              11,
              12,
              13,
              16
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.92",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              300,
              301
          ],
          "date_creation": "2023-04-19T11:40:40.198325Z",
          "date_last_modified": "2023-04-19T11:55:58.193012Z"
      },
      {
          "id": 127,
          "mcu": 9,
          "name": "5.94",
          "description": "Infinite update",
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.92",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              302
          ],
          "date_creation": "2023-04-19T11:42:59.431911Z",
          "date_last_modified": "2023-04-19T11:56:15.577475Z"
      },
      {
          "id": 128,
          "mcu": 9,
          "name": "5.95",
          "description": "Infinite update",
          "providers": [
              13
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.93",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              303
          ],
          "date_creation": "2023-04-19T11:43:18.725867Z",
          "date_last_modified": "2023-04-19T11:56:39.921900Z"
      },
      {
          "id": 129,
          "mcu": 9,
          "name": "5.18",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.43",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              304
          ],
          "date_creation": "2023-04-26T12:21:28.778061Z",
          "date_last_modified": "2023-05-25T13:50:16.855988Z"
      },
      {
          "id": 130,
          "mcu": 9,
          "name": "5.19",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.44",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              306,
              308
          ],
          "date_creation": "2023-05-09T13:25:44.857872Z",
          "date_last_modified": "2023-05-25T13:50:01.108421Z"
      },
      {
          "id": 131,
          "mcu": 2,
          "name": "2.31",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.17",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              307,
              317,
              324
          ],
          "date_creation": "2023-05-17T12:10:32.033954Z",
          "date_last_modified": "2023-08-03T15:43:13.497222Z"
      },
      {
          "id": 132,
          "mcu": 9,
          "name": "5.20",
          "description": "",
          "providers": [
              1,
              3,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.45",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              309,
              310,
              311
          ],
          "date_creation": "2023-06-08T11:12:44.683399Z",
          "date_last_modified": "2023-07-07T07:31:57.035917Z"
      },
      {
          "id": 133,
          "mcu": 9,
          "name": "5.96",
          "description": "Infinite update",
          "providers": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              19,
              20
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.94",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              312,
              313
          ],
          "date_creation": "2023-06-22T14:07:40.978395Z",
          "date_last_modified": "2023-06-22T14:12:23.535296Z"
      },
      {
          "id": 134,
          "mcu": 9,
          "name": "5.97",
          "description": "Infinite update",
          "providers": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              19,
              20
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.94",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              314
          ],
          "date_creation": "2023-06-22T14:15:07.881472Z",
          "date_last_modified": "2023-06-22T14:15:12.799967Z"
      },
      {
          "id": 135,
          "mcu": 9,
          "name": "5.98",
          "description": "Infinite update",
          "providers": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              19,
              20
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.95",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              315
          ],
          "date_creation": "2023-06-22T14:17:18.465497Z",
          "date_last_modified": "2023-06-22T14:17:24.441189Z"
      },
      {
          "id": 136,
          "mcu": 9,
          "name": "5.21",
          "description": null,
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.46",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              319,
              320
          ],
          "date_creation": "2023-07-21T09:58:26.445701Z",
          "date_last_modified": "2023-07-21T10:10:31.941980Z"
      },
      {
          "id": 137,
          "mcu": 9,
          "name": "5.22",
          "description": null,
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.46",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              319,
              320,
              321,
              325
          ],
          "date_creation": "2023-07-21T14:14:46.042931Z",
          "date_last_modified": "2023-08-09T13:07:49.102958Z"
      },
      {
          "id": 138,
          "mcu": 9,
          "name": "5.23",
          "description": null,
          "providers": [
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.47",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              326
          ],
          "date_creation": "2023-09-06T11:55:39.246533Z",
          "date_last_modified": "2023-09-06T11:58:10.286210Z"
      },
      {
          "id": 139,
          "mcu": 9,
          "name": "5.24",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.48",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              332
          ],
          "date_creation": "2023-09-21T12:51:07.690871Z",
          "date_last_modified": "2023-09-21T15:26:58.249464Z"
      },
      {
          "id": 140,
          "mcu": 2,
          "name": "2.32",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              9
          ],
          "from_bootloader_version": "1.18",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              335
          ],
          "date_creation": "2023-10-18T09:27:43.797204Z",
          "date_last_modified": "2023-10-19T14:14:30.356901Z"
      },
      {
          "id": 141,
          "mcu": 8,
          "name": "4.04",
          "description": "",
          "providers": [
              1,
              4,
              7,
              11,
              12
          ],
          "device_versions": [
              16
          ],
          "from_bootloader_version": "3.13",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              334
          ],
          "date_creation": "2023-10-18T09:28:00.710108Z",
          "date_last_modified": "2023-10-19T13:39:57.976397Z"
      },
      {
          "id": 142,
          "mcu": 9,
          "name": "5.25",
          "description": null,
          "providers": [
              1,
              4,
              7,
              12
          ],
          "device_versions": [
              17
          ],
          "from_bootloader_version": "0.49",
          "from_bootloader_version_id": null,
          "se_firmware_final_versions": [
              337
          ],
          "date_creation": "2023-11-28T12:21:21.059768Z",
          "date_last_modified": "2023-11-28T12:30:38.788506Z"
      }
  ];
  },
  () => getEnv("MANAGER_API_BASE"),
);

const compatibleMCUForDeviceInfo = (
  mcus: McuVersion[],
  deviceInfo: DeviceInfo,
  provider: number,
): McuVersion[] =>
  mcus.filter(
    m =>
      (deviceInfo.majMin === m.from_bootloader_version ||
        deviceInfo.version === m.from_bootloader_version) &&
      m.providers.includes(provider),
  );

const findBestMCU = (compatibleMCU: McuVersion[]): McuVersion | undefined => {
  let best = compatibleMCU[0];

  for (let i = 1; i < compatibleMCU.length; i++) {
    if (semver.gt(semver.coerce(compatibleMCU[i].name) || "", semver.coerce(best.name) || "")) {
      best = compatibleMCU[i];
    }
  }

  return best;
};

const getLanguagePackagesForDevice = async (deviceInfo: DeviceInfo): Promise<LanguagePackage[]> => {
  const deviceVersion = await getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo));

  const seFirmwareVersion = await getCurrentFirmware({
    version: deviceInfo.version,
    deviceId: deviceVersion.id,
    provider: getProviderId(deviceInfo),
  });

  const { data }: { data: LanguagePackageResponse[] } = await network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("MANAGER_API_BASE")}/language-package`,
      query: {
        livecommonversion,
      },
    }),
  });

  const allPackages: LanguagePackage[] = data.reduce(
    (acc, response) => [
      ...acc,
      ...response.language_package_version.map(p => ({
        ...p,
        language: response.language,
      })),
    ],
    [] as LanguagePackage[],
  );

  const packages = allPackages.filter(
    pack =>
      pack.device_versions.includes(deviceVersion.id) &&
      pack.se_firmware_final_versions.includes(seFirmwareVersion.id),
  );

  return packages;
};

const getLatestFirmware: (arg0: {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
}) => Promise<OsuFirmware | null | undefined> = makeLRUCache(
  async ({ current_se_firmware_final_version, device_version, provider }) => {
    const salt = getUserHashes().firmwareSalt;
    const {
      data,
    }: {
      data: {
        result: string;
        se_firmware_osu_version: OsuFirmware;
      };
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_latest_firmware`,
        query: {
          livecommonversion,
          salt,
        },
      }),
      data: {
        current_se_firmware_final_version,
        device_version,
        provider,
      },
    });

    if (data.result === "null") {
      return null;
    }

    return data.se_firmware_osu_version;
  },
  a =>
    `${getEnv("MANAGER_API_BASE")}_${a.current_se_firmware_final_version}_${a.device_version}_${
      a.provider
    }`,
);

const getCurrentOSU: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<OsuFirmware> = makeLRUCache(
  async input => {
    const { data } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_osu_version`,
        query: {
          livecommonversion,
        },
      }),
      data: {
        device_version: input.deviceId,
        version_name: `${input.version}-osu`,
        provider: input.provider,
      },
    });
    return data;
  },
  a => `${getEnv("MANAGER_API_BASE")}_${a.version}_${a.deviceId}_${a.provider}`,
);
const getCurrentFirmware: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<FinalFirmware> = makeLRUCache(
  async input => {
    const {
      data,
    }: {
      data: FinalFirmware;
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_firmware_version`,
        query: {
          livecommonversion,
        },
      }),
      data: {
        device_version: input.deviceId,
        version_name: input.version,
        provider: input.provider,
      },
    }).catch(error => {
      const status = error?.status || error?.response?.status;

      if (status === 404) throw new FirmwareNotRecognized();

      throw error;
    });
    return data;
  },
  a => `${getEnv("MANAGER_API_BASE")}_${a.version}_${a.deviceId}_${a.provider}`,
);
const getFinalFirmwareById: (id: number) => Promise<FinalFirmware> = makeLRUCache(
  async id => {
    const {
      data,
    }: {
      data: FinalFirmware;
    } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/firmware_final_versions/${id}`,
        query: {
          livecommonversion,
        },
      }),
    });
    return data;
  },
  id => `${getEnv("MANAGER_API_BASE")}}_${String(id)}`,
);

/**
 * Resolve applications details by hashes.
 * Order of outputs matches order of inputs.
 * If an application version is not found, a null is returned instead.
 * If several versions match the same hash, only the latest one is returned.
 *
 * Given an array of hashes that we can obtain by either listInstalledApps in this same
 * API (a websocket connection to a scriptrunner) or via direct apdus using hw/listApps.ts
 * retrieve all the information needed from the backend for those applications.
 */
const getAppsByHash: (hashes: string[]) => Promise<Array<App | null>> = makeLRUCache(
  async hashes => {
    const {
      data,
    }: {
      data: Array<ApplicationV2 | null>;
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/v2/apps/hash`,
        query: {
          livecommonversion,
        },
      }),
      data: hashes,
    });

    if (!data || !Array.isArray(data)) {
      throw new NetworkDown("");
    }

    return data.map(appV2 => (appV2 ? mapApplicationV2ToApp(appV2) : null));
  },
  hashes => `${getEnv("MANAGER_API_BASE")}_${hashes.join("-")}`,
);

const getDeviceVersion: (targetId: string | number, provider: number) => Promise<DeviceVersion> =
  makeLRUCache(
    async (targetId, provider) => {
      const {
        data,
      }: {
        data: DeviceVersion;
      } = await network({
        method: "POST",
        url: URL.format({
          pathname: `${getEnv("MANAGER_API_BASE")}/get_device_version`,
          query: {
            livecommonversion,
          },
        }),
        data: {
          provider,
          target_id: targetId,
        },
      }).catch(error => {
        const status = error?.status || error?.response?.status;

        if (status === 404)
          throw new FirmwareNotRecognized("manager api did not recognize targetId=" + targetId, {
            targetId,
          });

        throw error;
      });
      return data;
    },
    (targetId, provider) => `${getEnv("MANAGER_API_BASE")}_${targetId}_${provider}`,
  );

const install = (
  transport: Transport,
  context: string,
  params: any,
  unresponsiveExpectedDuringBulk?: boolean,
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(true), bulkSocketMock(3000));
  }

  log("manager", "install " + context, params);
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query: { ...params, livecommonversion },
    }),
    unresponsiveExpectedDuringBulk,
  }).pipe(remapSocketError(context));
};

const genuineCheck = (
  transport: Transport,
  {
    targetId,
    perso,
  }: {
    targetId: any;
    perso: any;
  },
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(false), resultMock("0000"));
  }

  log("manager", "genuineCheck", {
    targetId,
    perso,
  });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/genuine`,
      query: {
        targetId,
        perso,
        livecommonversion,
      },
    }),
  }).pipe(
    map(e => {
      if (e.type === "result") {

        console.log("Genuine Check");
        console.log(e.payload);

        return {
          type: "result",
          payload: String(e.payload || ""),
        };
      }

      return e;
    }),
  );
};

export type ListInstalledAppsEvent =
  | SocketEvent
  | {
      type: "result";
      payload: Array<{
        hash: string;
        name: string;
        hash_code_data?: string;
      }>;
    };

const listInstalledApps = (
  transport: Transport,
  {
    targetId,
    perso,
  }: {
    targetId: any;
    perso: any;
  },
): Observable<ListInstalledAppsEvent> => {
  if (getEnv("MOCK")) {
    const result = global._listInstalledApps_mock_result;
    invariant(result, "using MOCK, global._listInstalledApps_mock_result must be set");
    return createMockSocket(secureChannelMock(false), resultMock(result));
  }

  log("manager", "listInstalledApps", {
    targetId,
    perso,
  });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/apps/list`,
      query: {
        targetId,
        perso,
        livecommonversion,
      },
    }),
  }).pipe(
    remapSocketError("listInstalledApps"),
    map<any, ListInstalledAppsEvent>(o => {

      if (o.type === "result") {

        const mappedPayload = [...o.payload].map(a => {
          invariant(typeof a === "object" && a, "payload array item are objects");
          const { hash, name, hash_code_data } = a;
          invariant(typeof hash === "string", "hash is defined");
          invariant(typeof name === "string", "name is defined");
          return {
            hash,
            name,
            hash_code_data,
          };
        })

        return {
          type: "result",
          payload: mappedPayload,
        };
      }

      return o;
    }),
  );
};

const installMcu = (
  transport: Transport,
  context: string,
  {
    targetId,
    version,
  }: {
    targetId: number | string;
    version: string;
  },
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(false), bulkSocketMock(5000));
  }

  log("manager", "installMCU " + context, {
    targetId,
    version,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/mcu`,
      query: {
        targetId,
        version,
        livecommonversion,
      },
    }),
    unresponsiveExpectedDuringBulk: true,
  }).pipe(remapSocketError(context));
};

function retrieveMcuVersion(finalFirmware: FinalFirmware): Promise<McuVersion | undefined> {
  return getMcus()
    .then(mcus =>
      mcus.filter(deviceInfo => {
        const provider = getProviderId(deviceInfo);
        return mcu => mcu.providers.includes(provider);
      }),
    )
    .then(mcus => mcus.filter(mcu => mcu.from_bootloader_version !== "none"))
    .then(mcus =>
      findBestMCU(
        finalFirmware.mcu_versions.map(id => mcus.find(mcu => mcu.id === id)).filter(Boolean),
      ),
    );
}

const API = {
  applicationsByDevice,
  catalogForDevice,
  listApps,
  listInstalledApps,
  listCategories,
  getMcus,
  getLanguagePackagesForDevice,
  getLatestFirmware,
  getAppsByHash,
  getCurrentOSU,
  compatibleMCUForDeviceInfo,
  findBestMCU,
  getCurrentFirmware,
  getFinalFirmwareById,
  getDeviceVersion,
  install,
  genuineCheck,
  installMcu,
  retrieveMcuVersion,
};
export default API;
