import { NativeModules, DeviceEventEmitter } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { DisconnectedDeviceDuringOperation, DisconnectedDevice } from "@ledgerhq/errors";
import { TraceContext, trace } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Subject, from, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";

const LOG_TYPE = "react-native-hid";

type DeviceObj = {
  vendorId: number;
  productId: number;
};

const disconnectedErrors = [
  "I/O error",
  "Attempt to invoke virtual method 'int android.hardware.usb.UsbDevice.getDeviceClass()' on a null object reference",
  "Invalid channel",
  "Permission denied by user for device",
];

const listLedgerDevices = async () => {
  const devices = await NativeModules.HID.getDeviceList();
  return devices.filter(d => d.vendorId === ledgerUSBVendorId);
};

// Listens to our Native Module events on device connections and disconnections
const liveDeviceEventsSubject: Subject<DescriptorEvent<any>> = new Subject();
DeviceEventEmitter.addListener("onDeviceConnect", (device: any) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);

  trace({
    type: LOG_TYPE,
    message: "Native HID event: device connected",
    data: { device, deviceModel },
  });

  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel,
  });
});
DeviceEventEmitter.addListener("onDeviceDisconnect", (device: any) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);

  trace({
    type: LOG_TYPE,
    message: "Native HID event: device disconnected",
    data: { device, deviceModel },
  });

  liveDeviceEventsSubject.next({
    type: "remove",
    descriptor: device,
    deviceModel,
  });
});

const liveDeviceEvents = liveDeviceEventsSubject;

/**
 * Ledger's React Native HID Transport implementation
 *
 * @example
 * import TransportHID from "@ledgerhq/react-native-hid";
 * ...
 * TransportHID.create().then(transport => ...)
 */
export default class HIDTransport extends Transport {
  id: number;
  deviceModel: DeviceModel | null | undefined;

  constructor(nativeId: number, productId: number, context?: TraceContext) {
    super({ context, logType: LOG_TYPE });
    this.id = nativeId;
    this.deviceModel = identifyUSBProductId(productId);

    this.tracer.trace("New instance of React Native HID Transport", { nativeId, productId });
  }

  /**
   * Check if the transport is supported (basically true on Android)
   */
  static isSupported = (): Promise<boolean> => Promise.resolve(!!NativeModules.HID);

  /**
   * List currently connected devices.
   * @returns Promise of devices
   */
  static async list(): Promise<any[]> {
    if (!NativeModules.HID) return Promise.resolve([]);
    return await listLedgerDevices();
  }

  /**
   * Listen to ledger devices events
   */
  static listen(observer: any): any {
    if (!NativeModules.HID) {
      return {
        unsubscribe: () => {},
      };
    }

    return concat(
      from(listLedgerDevices()).pipe(
        mergeMap(devices =>
          from(
            devices.map(device => ({
              type: "add",
              descriptor: device,
              deviceModel: identifyUSBProductId(device.productId),
            })),
          ),
        ),
      ),
      liveDeviceEvents,
    ).subscribe(observer);
  }

  /**
   * Opens a HID transport with a Ledger device
   *
   * @param deviceObj descriptor of the device to open
   * @param timeout Not used
   * @param context An optional context object for log/tracing strategy
   * @returns a Promise with a HIDTransport instance
   */
  static async open(deviceObj: DeviceObj, _timeout?: number, context?: TraceContext) {
    try {
      const nativeObj = await NativeModules.HID.openDevice(deviceObj);
      return new HIDTransport(nativeObj.id, deviceObj.productId, context);
    } catch (error: any) {
      trace({
        type: LOG_TYPE,
        message: "Error while opening device using React Native HID Transport",
        data: { error },
        context,
      });
      if (disconnectedErrors.includes(error.message)) {
        throw new DisconnectedDevice(error.message);
      }

      throw error;
    }
  }

  /**
   * @param {Buffer} apdu input value
   * @param {Object} options - Contains optional options for the exchange function
   *  - abortTimeoutMs: stop the exchange after a given timeout. Another timeout exists
   *    to detect unresponsive device (see `unresponsiveTimeout`). This timeout aborts the exchange.
   * @returns Promise of apdu response
   */
  async exchange(apdu: Buffer, { abortTimeoutMs }: { abortTimeoutMs?: number } = {}): Promise<any> {
    this.tracer.trace("Exchanging APDU ...", { abortTimeoutMs });

    return this.exchangeAtomicImpl(async () => {
      try {
        const apduHex = apdu.toString("hex");
        this.tracer.withType("apdu").trace(`=> ${apduHex}`);
        const resultHex = await NativeModules.HID.exchange(this.id, apduHex);

        const res = Buffer.from(resultHex, "hex");
        this.tracer.withType("apdu").trace(`<=  ${resultHex}`);

        return res;
      } catch (error: any) {
        this.tracer.trace("Error while exchanging APDU", { error });

        if (disconnectedErrors.includes(error.message)) {
          this.emit("disconnect", error);
          throw new DisconnectedDeviceDuringOperation(error.message);
        }

        throw error;
      }
    });
  }

  /**
   * Close the transport
   * @returns Promise
   */
  async close() {
    this.tracer.trace("Closing, awaiting current busy exchange ...");
    await this.exchangeBusyPromise;

    this.tracer.trace("Current busy exchange was resolved, closing ...");
    await NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}
}
