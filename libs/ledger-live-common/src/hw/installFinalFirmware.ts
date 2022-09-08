import Transport from "@ledgerhq/hw-transport";
import { Observable, Subject, from, concat, of } from "rxjs";
import URL from "url";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../api/Manager";
import type { RunnerEvent } from "../apps/types";
import { getEnv } from "../env";
import getDeviceInfo from "./getDeviceInfo";
import { getProviderId } from "../manager";
import type { DeviceInfo, FinalFirmware } from "@ledgerhq/types-live";
import type { BimCapableTransport } from "@ledgerhq/types-devices";

export const fetchNextFirmware = (
  deviceInfo: DeviceInfo
): Observable<FinalFirmware> =>
  from(
    ManagerAPI.getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo))
  ).pipe(
    mergeMap((device) =>
      from(
        ManagerAPI.getCurrentOSU({
          deviceId: device.id,
          version: deviceInfo.version,
          provider: getProviderId(deviceInfo),
        })
      )
    ),
    mergeMap((firmware) =>
      from(
        ManagerAPI.getFinalFirmwareById(firmware.next_se_firmware_final_version)
      )
    )
  );
export default (transport: Transport): Observable<any> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap((deviceInfo) =>
      fetchNextFirmware(deviceInfo).pipe(
        mergeMap((nextFirmware) => {
          // Transport instances now expose an optional transportId, in this case we use it to
          // leverage BIM capabilities when available.
          let install;
          if (["BleTransport"].includes(transport.transportId)) {
            const bimTransport = transport as unknown as BimCapableTransport;
            const observable = new Subject<RunnerEvent>();
            const fwUpdateURL = URL.format({
              pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
              query: {
                targetId: deviceInfo.targetId,
                firmware: nextFirmware.firmware,
                firmwareKey: nextFirmware.firmware_key,
                perso: nextFirmware.perso,
              },
            });
            bimTransport.runner(observable, fwUpdateURL);
            install = observable;
          } else {
            install = ManagerAPI.install(transport, "firmware", {
              targetId: deviceInfo.targetId,
              firmware: nextFirmware.firmware,
              firmwareKey: nextFirmware.firmware_key,
              perso: nextFirmware.perso,
            });
          }

          return concat(
            of({
              type: "install",
              step: "firmware",
            }),
            install
          );
        })
      )
    )
  );
