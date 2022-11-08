import { log } from "@ledgerhq/logs";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { from } from "rxjs";
import { timeout } from "rxjs/operators";
import { NativeModules } from "react-native";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import prepareFirmwareUpdate from "@ledgerhq/live-common/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/hw/firmwareUpdate-main";
import { store } from "../src/context/LedgerStore";
import type { FwUpdateBackgroundEvent } from "../src/reducers/types";
import { addBackgroundEvent } from "../src/actions/appstate";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

/**
 * This unorthodox way of doing the firmware update has an explanation, originally we implemented
 * the USB OTG method and subsequently we added the BLE on top, it made little sense to rewrite
 * it when it's working solidly this way.
 *
 * - [USB OTG] (Android) A background mode, invoked from the native Android part
 * as a headlessJS runner that is not able to touch UI, but it will allow us to complete
 * tasks even when the device goes to the background. We don't have access to hooks
 * because we are not inside a component but we can read/write the store so we'll
 * use that as the common-ground.
 *
 * - [BLE] A foreground mode, just rendering this as a component will start the firmware
 * update process and use the same even syncronization as the USB original implementation
 * to keep the UI up to date. The first implementation is not capable of working in the background
 * but it shouldn't be too hard to move the long running task of FW payload transfer into a
 * Runner on the native side if needed.
 */

const BackgroundRunnerService = async ({
  deviceId,
  firmwareSerializedJson,
  backgroundMode = true,
}: {
  deviceId: string;
  firmwareSerializedJson: string;
  backgroundMode: boolean;
}) => {
  const TAG = backgroundMode ? "headlessJS" : "BLEFWUpdate";

  const emitEvent = (e: FwUpdateBackgroundEvent) => {
    log(TAG, JSON.stringify(e));
    store.dispatch(addBackgroundEvent(e));
  };

  const latestFirmware = JSON.parse(firmwareSerializedJson) as
    | FirmwareUpdateContext
    | null
    | undefined;

  if (!latestFirmware) {
    log(TAG, "no need to update");
    return null;
  }

  const onError = (error: Error) => {
    emitEvent({ type: "error", error });
    if (backgroundMode) NativeModules.BackgroundRunner.stop();
  };

  const onFirmwareUpdated = () => {
    emitEvent({ type: "firmwareUpdated" });
    if (backgroundMode) NativeModules.BackgroundRunner.stop();
  };

  const waitForOnlineDevice = (maxWait: number) =>
    withDevicePolling(deviceId)(
      transport => from(getDeviceInfo(transport)),
      () => true,
    ).pipe(timeout(maxWait));

  prepareFirmwareUpdate(deviceId, latestFirmware).subscribe({
    next: ({ progress, displayedOnDevice }) => {
      if (displayedOnDevice) {
        emitEvent({ type: "confirmUpdate" });
      } else {
        emitEvent({ type: "downloadingUpdate", progress });
      }
    },
    error: onError,
    complete: () => {
      // Depending on the update path, we might need to run the firmwareMain or simply wait until
      // the device is online.
      if (
        latestFirmware.shouldFlashMCU ||
        hasFinalFirmware(latestFirmware.final)
      ) {
        emitEvent({ type: "flashingMcu" });
        mainFirmwareUpdate(deviceId, latestFirmware).subscribe({
          next: ({ progress, installing }) => {
            // NB BLE didn't seem to emit the 100% but the update is still processed.
            if (progress > 0.95 && installing === "flash-mcu") {
              // this is the point where we lose communication with the device until the update
              // is finished and the user has entered their PIN. Therefore the message here should
              // be generic about waiting for the firmware to finish and then entering the pin
              emitEvent({ type: "confirmPin" });
            } else {
              emitEvent({ type: "flashingMcu", progress, installing });
            }
          },
          error: onError,
          complete: () => {
            emitEvent({ type: "confirmPin" });
            waitForOnlineDevice(5 * 60 * 1000).subscribe({
              error: onError,
              next: updatedDeviceInfo =>
                emitEvent({ type: "firmwareUpdated", updatedDeviceInfo }),
              complete: onFirmwareUpdated,
            });
          },
        });
      } else {
        emitEvent({ type: "confirmPin" });
        // We're waiting forever condition that make getDeviceInfo work
        waitForOnlineDevice(FIVE_MINUTES_IN_MS).subscribe({
          error: onError,
          next: updatedDeviceInfo =>
            emitEvent({ type: "firmwareUpdated", updatedDeviceInfo }),
          complete: onFirmwareUpdated,
        });
      }
    },
  });

  return null;
};

export default BackgroundRunnerService;
