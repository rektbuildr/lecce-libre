// @flow
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import Transport from "@ledgerhq/hw-transport-node-ble";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const cmd = (): Observable<DescriptorEvent<*>> =>
  Observable.create(Transport.listen).pipe(
    map(data => ({
      ...data,
      descriptor: JSON.parse(data.descriptor.toString()),
    })),
  );

export default cmd;
