/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import { createRoot } from "react-dom/client";
import "@pages/popup/index.css";
import Popup from "@pages/popup/Popup";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";

refreshOnUpdate("pages/popup");


// // @ts-ignore
// if (window && window.navigator.usb) {
//   // @ts-ignore
//   window.navigator.usb.addEventListener("connect", console.log.bind(console));
//   // @ts-ignore
//   window.navigator.usb.addEventListener(
//     "disconnect",
//     console.log.bind(console)
//   );
// }

function init() {
  console.log(`🚀 Popup is running in ${process.env.NODE_ENV} mode`);

  const appContainer = document.querySelector("#app-container");
  if (!appContainer) {
    throw new Error("Can not find #app-container");
  }
  const root = createRoot(appContainer);

  // registerTransportModule({
  //   id: "webhid",

  //   open: (id: string): Promise<any> => {
  //     if (id.startsWith("webhid")) {
  //       return TransportWebHID.create();
  //     }
  //     return null;
  //   },

  //   disconnect: (id) =>
  //     id.startsWith("webhid")
  //       ? Promise.resolve() // nothing to do
  //       : null,
  // });

  root.render(<Popup />);
}

init();
