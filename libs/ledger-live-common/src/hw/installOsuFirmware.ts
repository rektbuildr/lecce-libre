import Transport from "@ledgerhq/hw-transport";
import type { OsuFirmware } from "@ledgerhq/types-live";
import { Observable, Subject } from "rxjs";
import URL from "url";
import type { RunnerEvent } from "../apps/types";
import { getEnv } from "../env";
import type { BimCapableTransport } from "@ledgerhq/types-devices";
import ManagerAPI from "../api/Manager";

export default (
  transport: Transport,
  targetId: string | number,
  firmware: OsuFirmware
): Observable<any> => {
  const query = {
    targetId,
    firmware: firmware.firmware,
    perso: firmware.perso,
    firmwareKey: firmware.firmware_key,
  };
  if (["BleTransport"].includes(transport.transportId)) {
    // Nb runners need to account for irresponsive devices too :thinking:
    const bimTransport = transport as unknown as BimCapableTransport;
    const observable = new Subject<RunnerEvent>();
    const fwUpdateURL = URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query,
    });
    bimTransport.runner(observable, fwUpdateURL);
    return observable;
  }
  return ManagerAPI.install(transport, "firmware", query, true);
};
