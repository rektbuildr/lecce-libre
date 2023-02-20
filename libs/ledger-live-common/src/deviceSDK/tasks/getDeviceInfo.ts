import { LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";

import isDevFirmware from "../../hw/isDevFirmware";
import { withDevice } from "../../hw/deviceAccess";
import { PROVIDERS } from "../../manager/provider";
import { Observable } from "rxjs";
import { delay, map, switchMap } from "rxjs/operators";
import { SharedTaskEvent, sharedLogicTaskWrapper } from "./core";
import { quitApp } from "../commands/quitApp";

const ManagerAllowedFlag = 0x08;
const PinValidatedFlag = 0x80;

export type GetDeviceInfoTaskArgs = { deviceId: DeviceId };

// Do we really need an Error object ? :
// - Longer to write a CustomError class that extends Error for each type of error
// - our createCustomErrorClass function creates Error object that are hard/weird to compare
//  (instanceOf does not work correctly)
// I propose to only use a uniont of string literals:
// - they are errors from the logic of this task, so we know where and why they are thrown
// - easy to add one, easy to compare
export type GetDeviceInfoTaskError =
  | "DeviceOnDashboardExpected"
  | "AnotherErrorHappeningDuringTheLogicOfThisTask";

export type GetDeviceInfoTaskEvent =
  | { type: "data"; deviceInfo: DeviceInfo }
  | { type: "taskError"; error: GetDeviceInfoTaskError }
  | SharedTaskEvent;

function internalGetDeviceInfoTask({
  deviceId,
}: GetDeviceInfoTaskArgs): Observable<GetDeviceInfoTaskEvent> {
  return new Observable((subscriber) => {
    return (
      withDevice(deviceId)((transport) =>
        quitApp(transport).pipe(
          delay(1000),
          switchMap(() => {
            console.log(`🦖 getDeviceInfo task: calling getVersion ⬇️`);
            return getVersion(transport);
          }),
          map((value) => {
            if (value.type === "unresponsive") {
              console.log(
                `🦖 getDeviceInfo 🔥 unresponsive 🔥: ${JSON.stringify(value)}`
              );

              // transport.close().then(() => {
              //   console.log(
              //     `🦖 getDeviceInfo unresponsive -> closed 🧼: ${JSON.stringify(
              //       value
              //     )}`
              //   );
              // });
              // throw new LockedDeviceError();

              subscriber.error(new LockedDeviceError());
              return;

              // return { type: "error" as const, error: new LockedDeviceError() };
            }

            const { firmwareInfo } = value;

            const {
              isBootloader,
              rawVersion,
              targetId,
              seVersion,
              seTargetId,
              mcuBlVersion,
              mcuVersion,
              mcuTargetId,
              flags,
              bootloaderVersion,
              hardwareVersion,
              languageId,
            } = firmwareInfo;

            const isOSU = rawVersion.includes("-osu");
            const version = rawVersion.replace("-osu", "");
            const m = rawVersion.match(/([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/);
            const [, majMin, , , postDash] = m || [];
            const providerName = PROVIDERS[postDash] ? postDash : null;
            const flag = flags.length > 0 ? flags[0] : 0;
            const managerAllowed = !!(flag & ManagerAllowedFlag);
            const pinValidated = !!(flag & PinValidatedFlag);

            let isRecoveryMode = false;
            let onboarded = true;
            if (flags.length === 4) {
              // Nb Since LNS+ unseeded devices are visible + extra flags
              isRecoveryMode = !!(flags[0] & 0x01);
              onboarded = !!(flags[0] & 0x04);
            }

            log(
              "hw",
              "deviceInfo: se@" +
                version +
                " mcu@" +
                mcuVersion +
                (isOSU ? " (osu)" : isBootloader ? " (bootloader)" : "")
            );

            const hasDevFirmware = isDevFirmware(seVersion);
            const deviceInfo: DeviceInfo = {
              version,
              mcuVersion,
              seVersion,
              mcuBlVersion,
              majMin,
              providerName: providerName || null,
              targetId,
              hasDevFirmware,
              seTargetId,
              mcuTargetId,
              isOSU,
              isBootloader,
              isRecoveryMode,
              managerAllowed,
              pinValidated,
              onboarded,
              bootloaderVersion,
              hardwareVersion,
              languageId,
            };

            return { type: "data" as const, deviceInfo };
          })
        )
      )
        // Any error will be handled by the sharedLogicTaskWrapper, which will map it a relevant event
        .subscribe(subscriber)
    );
  });
}

export const getDeviceInfoTask = sharedLogicTaskWrapper(
  internalGetDeviceInfoTask
);
