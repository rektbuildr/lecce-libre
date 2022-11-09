import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Subscription } from "rxjs";
import { ListenDescriptorEvent } from "@ledgerhq/hw-transport-node-hid-singleton";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import { command } from "~/renderer/commands";

export const useListenToHidDevices = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    let sub: Subscription;
    let subBt: Subscription;

    // resetDevices();

    function syncDevices() {
      const devices: { [key: string]: boolean } = {};

      sub = command("listenToHidDevices")().subscribe(
        ({ device, deviceModel, type, descriptor }: ListenDescriptorEvent) => {
          if (device) {
            const deviceId = descriptor || "";
            const stateDevice = {
              deviceId,
              modelId: deviceModel ? deviceModel.id : DeviceModelId.nanoS,
              wired: true,
            };

            if (type === "add") {
              devices[deviceId] = true;
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              delete devices[deviceId];
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        () => {
          // resetDevices();
          syncDevices();
        },
        () => {
          // resetDevices();
          syncDevices();
        },
      );
    }

    function syncBtDevices() {
      const devices: { [key: string]: boolean } = {};
      let lastDeviceId: string = null;

      subBt = command("listenBluetoothDevices")().subscribe(
        ({ device, deviceModel, type, descriptor }: ListenDescriptorEvent) => {
          if (device && device.id !== lastDeviceId) {
            lastDeviceId = device.id;
            const stateDevice = {
              deviceId: descriptor || "",
              modelId: DeviceModelId.nanoX, // deviceModel ? deviceModel.id : DeviceModelId.nanoX,
              wired: false,
            };

            if (type === "add") {
              devices[descriptor.id] = true;
              dispatch(addDevice(stateDevice));
            } else if (type === "remove") {
              delete devices[descriptor.id];
              dispatch(removeDevice(stateDevice));
            }
          }
        },
        error => {
          console.log("Bluetooth error.", error);
          setTimeout(syncBtDevices, 1000);
        },
        () => {
          console.log("Bluetooth end.");
          setTimeout(syncBtDevices, 1000);
        },
      );
    }

    const timeoutSyncDevices = setTimeout(syncDevices, 1000);
    syncBtDevices();

    return () => {
      clearTimeout(timeoutSyncDevices);
      sub.unsubscribe();
      subBt.unsubscribe();
    };
  }, [dispatch]);

  return null;
};
