import { from, of } from "rxjs";
import { delay } from "rxjs/operators";
import Transport, {
  TransportStatusError,
  StatusCodes,
} from "@ledgerhq/hw-transport";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import genuineCheck from "./genuineCheck";
import { DeviceInfo } from "@ledgerhq/types-live";
import {
  getGenuineCheckFromDeviceId,
  GetGenuineCheckFromDeviceIdResult,
} from "./getGenuineCheckFromDeviceId";

jest.mock("./deviceAccess");
jest.mock("./getDeviceInfo");
jest.mock("./genuineCheck");
jest.useFakeTimers();

const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);
const mockedGenuineCheck = jest.mocked(genuineCheck);
const mockedWithDevice = jest.mocked(withDevice);

mockedWithDevice.mockReturnValue((job) => from(job(new Transport())));

const aDeviceInfo = {
  mcuVersion: "A_MCU_VERSION",
  version: "A_VERSION",
  majMin: "A_MAJ_MIN",
  targetId: "0.0",
  isBootloader: true,
  isOSU: true,
  providerName: undefined,
  managerAllowed: false,
  pinValidated: true,
};

// TODO
describe("getLatestAvailableFirmwareFromDeviceId", () => {
  beforeEach(() => {
    mockedGetDeviceInfo.mockResolvedValue(aDeviceInfo);
  });

  afterEach(() => {
    mockedGetDeviceInfo.mockClear();
    mockedGenuineCheck.mockClear();
    jest.clearAllTimers();
  });

  describe("When the device is locked during a genuine check, and it responded with a locked-device error", () => {
    it("should notify the function consumer of the need to unlock the device, and once done, continue the genuine check flow", (done) => {
      mockedGetDeviceInfo
        .mockRejectedValueOnce(
          new TransportStatusError(StatusCodes.LOCKED_DEVICE)
        )
        .mockReturnValueOnce(of(aDeviceInfo as DeviceInfo).toPromise());

      mockedGenuineCheck.mockReturnValue(
        of({
          type: "device-permission-requested",
          wording: "",
        })
      );

      const pollingIntervalOnlockedDeviceMs = 1000;
      let step = 0;

      const sub = getGenuineCheckFromDeviceId({
        deviceId: "A_DEVICE_ID",
        lockedDeviceTimeoutMs: 1000,
        pollingIntervalOnlockedDeviceMs,
      }).subscribe({
        next: ({
          socketEvent,
          deviceIsLocked,
        }: GetGenuineCheckFromDeviceIdResult) => {
          try {
            switch (step) {
              case 0:
                expect(socketEvent).toBeNull();
                expect(deviceIsLocked).toBe(true);
                break;
              case 1:
                expect(socketEvent).toBeNull();
                expect(deviceIsLocked).toBe(false);
                break;
              case 2:
                expect(socketEvent).toEqual({
                  type: "device-permission-requested",
                  wording: "",
                });
                expect(deviceIsLocked).toBe(false);
                done();
                sub.unsubscribe();
                break;
            }
          } catch (expectError) {
            done(expectError);
            sub.unsubscribe();
          }

          step += 1;
          jest.advanceTimersByTime(pollingIntervalOnlockedDeviceMs);
        },
        error: (error: any) => {
          done(error);
          sub.unsubscribe();
        },
      });

      jest.advanceTimersByTime(1);
    });
  });
});
