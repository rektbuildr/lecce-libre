import React, { useCallback, useEffect, useRef, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import { open } from "@ledgerhq/live-common/hw/index";
import logo from "@assets/img/logo.svg";
import "@pages/popup/Popup.css";
// import Button from "@components/Button";

const Popup = () => {
  console.log(`🚀 Popup is running in ${process.env.NODE_ENV} mode`);
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={onTransportOpen}>Connect to transport</button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React!
        </a>
      </header>
    </div>
  );
};

export default Popup;
