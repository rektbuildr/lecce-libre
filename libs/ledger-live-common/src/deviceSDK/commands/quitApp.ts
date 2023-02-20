import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";

export function quitApp(transport: Transport): Observable<void> {
  console.log(`🦖 quitApp !`);

  return new Observable((observer) => {
    transport
      .send(0xb0, 0xa7, 0x00, 0x00)
      .then(() => {
        observer.next();
        observer.complete();
      })
      .catch((error) => {
        console.log(`🦖 ❌ quitApp error: ${JSON.stringify(error)} !`);
        observer.error(error);
      });
  });
}
