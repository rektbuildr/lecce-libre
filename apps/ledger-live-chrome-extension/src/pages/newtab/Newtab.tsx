/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "@assets/img/logo.svg";
import "@pages/newtab/Newtab.css";
import "@pages/newtab/Newtab.scss";
import Transport from "@ledgerhq/hw-transport";

import { open } from "@ledgerhq/live-common/hw/index";
// import quitApp from "@ledgerhq/live-common/hw/quitApp";
import openApp from "@ledgerhq/live-common/hw/openApp";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { Observable, of, switchMap } from "rxjs";
import { getDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo";

// @ts-ignore
navigator.hid.addEventListener("connect", (event) => {
  console.log(`🔮 HID connect: ${JSON.stringify(event)}`);
});

// @ts-ignore
navigator.hid.addEventListener("disconnect", (event) => {
  console.log(`🔮 HID disconnect: ${JSON.stringify(event)}`);
});

function quitApp(
  transport: Transport
): Observable<void> {
  return new Observable((observer) => {
    transport.send(0xb0, 0xa7, 0x00, 0x00).then(
      () => {
        observer.next();
        observer.complete();
      }      
    )
  });
}

const Newtab = () => {
  const [transport, setTransport] = useState<Transport | null>(null);
  const [transportOpening, setTransportOpening] = useState(false);

  const useListenTransportDisconnect = (cb, deps) => {
    const ref = useRef({ cb });
    useEffect(() => {
      ref.current = { cb };
    }, deps);
    return useCallback(
      (t) => {
        const listener = () => {
          t.off("disconnect", listener);
          ref.current.cb(t);
        };
        t.on("disconnect", listener);
      },
      [ref]
    );
  };

  const listenTransportDisconnect = useListenTransportDisconnect(
    (t) => {
      if (transport === t) {
        setTransport(null);
      } else {
        console.log(`❌ disconnecting to an unknown transport ${t}`);
      }
    },
    [transport]
  );

  const onTransportOpen = useCallback(() => {
    setTransportOpening(true);
    setTransport(null);
    open("webhid").then(
      (t) => {
        console.log(`🔮 opening transport: ${JSON.stringify(t)}`);
        setTransportOpening(false);
        setTransport(t);
        listenTransportDisconnect(t);
      },
      (error) => {
        setTransportOpening(false);
        console.log(`❌ error opening transport: ${JSON.stringify(error)}`);
      }
    );
  }, [listenTransportDisconnect]);

  const onAppOpenCurrentSytem = useCallback(() => {
    // if (!transport) {
    //   console.log("❌ no transport");
    //   return;
    // }

    // @ts-ignore
    withDevice("webhid")((transport: Transport) => {
      return quitApp(transport).pipe(
        switchMap(() => of(openApp(transport, "Ethereum")))
      );
    }).subscribe({
      next: (e) => console.log(`🔮 next: ${JSON.stringify(e)}`),
      complete: () => console.log("🔮 app close and open complete"),
      error: (e) => console.log(`🔮 error: ${JSON.stringify(e)}`),
    });

    // quitApp(transport)
    //   .then(() => {
    //     console.log("🔮 app closed");
    //     openApp(transport, "Ethereum")
    //       .then(() => {
    //         console.log("🔮 app opened");
    //       })
    //       .catch((error) => {
    //         console.log(`❌ error opening app: ${JSON.stringify(error)}`);
    //       });
    //   })
    //   .catch((error) => {
    //     console.log(`❌ error closing app: ${JSON.stringify(error)}`);
    //   });
  }, [transport]);


  const onAppOpen = useCallback(() => {
    // if (!transport) {
    //   console.log("❌ no transport");
    //   return;
    // }

    getDeviceInfoAction({ deviceId: "webhid" }).subscribe({
      next: (e) => console.log(`🔮 next: ${JSON.stringify(e)}`),
      complete: () => console.log("🔮 app close and open complete"),
      error: (e) => console.log(`🔮 error: ${JSON.stringify(e)}`),
    });
  }, [transport]);

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={onTransportOpen}>Connect to transport</button>
        <button onClick={onAppOpen}>Open ethereum app</button>
      </header>
    </div>
  );
};

export default Newtab;
