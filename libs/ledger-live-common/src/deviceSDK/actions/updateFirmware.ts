import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable, of } from "rxjs";
import { filter, scan, switchMap } from "rxjs/operators";
import {
  updateFirmwareTask,
  UpdateFirmwareTaskEvent,
} from "../tasks/updateFirmware";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskEvent,
} from "../tasks/getDeviceInfo";
import {
  FullActionState,
  initialSharedActionState,
  sharedReducer,
} from "./core";
import {
  getLatestFirmwareTask,
  GetLatestFirmwareTaskErrorEvent,
} from "../tasks/getLatestFirmware";

export type updateFirmwareActionArgs = {
  deviceId: DeviceId;
};

export type UpdateFirmwareActionState = FullActionState<{
  step:
    | "installingOsu"
    | "flashingMcu"
    | "flashingBootloader"
    | "installOsuDevicePermissionRequested"
    | "installOsuDevicePermissionGranted"
    | "allowSecureChannelRequested"
    | "firmwareUpdateCompleted"
    | "preparingUpdate";
  progress: number;
  error: { type: "UpdateFirmwareError"; message?: string };
}>;

export const initialState: UpdateFirmwareActionState = {
  step: "preparingUpdate",
  progress: 0,
  ...initialSharedActionState,
};

export function updateFirmwareAction({
  deviceId,
}: updateFirmwareActionArgs): Observable<UpdateFirmwareActionState> {
  return getDeviceInfoTask({ deviceId })
    .pipe(
      filter<GetDeviceInfoTaskEvent, { type: "data"; deviceInfo: DeviceInfo }>(
        (e): e is { type: "data"; deviceInfo: DeviceInfo } => {
          return e.type === "data";
        }
      ),
      switchMap(({ deviceInfo }) => {
        return getLatestFirmwareTask({ deviceId, deviceInfo });
      }),
      switchMap((latestFirmwareData) => {
        if (latestFirmwareData.type !== "data") {
          return of(latestFirmwareData);
        } else {
          return updateFirmwareTask({
            deviceId,
            updateContext: latestFirmwareData.firmwareUpdateContext,
          });
        }
      })
    )
    .pipe(
      scan<
        UpdateFirmwareTaskEvent | GetLatestFirmwareTaskErrorEvent,
        UpdateFirmwareActionState
      >((currentState, event) => {
        switch (event.type) {
          case "taskError":
            return {
              ...initialState,
              error: {
                type: "UpdateFirmwareError",
                error: event.error,
              },
            };
          case "installingOsu":
          case "flashingMcu":
          case "flashingBootloader":
            return {
              ...currentState,
              step: event.type,
              progress: event.progress,
            };
          case "allowSecureChannelRequested":
          case "installOsuDevicePermissionRequested":
          case "installOsuDevicePermissionGranted":
          case "firmwareUpdateCompleted":
            return { ...currentState, step: event.type };
          default:
            return {
              ...currentState,
              ...sharedReducer({
                event,
              }),
            };
        }
      }, initialState)
    );
}
