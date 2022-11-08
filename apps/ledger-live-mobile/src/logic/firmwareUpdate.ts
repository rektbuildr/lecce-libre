import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { satisfies as versionSatisfies, coerce } from "semver";

const deviceVersionRangesForUpdate: { [key in DeviceModelId]?: string } = {
  nanoS: ">=1.6.1",
  nanoX: ">=1.2.4-6 || =2.1.0-lo2 || =2.1.0-lo4",
  nanoSP: ">=1.0.0-0",
  nanoFTS: ">=0.4.1 || =2.0.2-il0 || =2.0.2-il1 || =2.0.2-il2 || =2.0.2-il3",
};

export const isFirmwareUpdateVersionSupported = (
  deviceInfo: DeviceInfo,
  modelId: DeviceModelId,
) =>
  Boolean(deviceVersionRangesForUpdate[modelId]) &&
  versionSatisfies(
    coerce(deviceInfo.version) || "0.0.0",
    deviceVersionRangesForUpdate[modelId] as string,
  );
