import React from "react";
import { createRoot } from "react-dom/client";
import Newtab from "@pages/newtab/Newtab";
import "@pages/newtab/index.css";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";

refreshOnUpdate("pages/newtab");

console.log(`🚀 New tab is running in ${process.env.NODE_ENV} mode`);

registerTransportModule({
  id: "webhid",

  open: (id: string): Promise<any> => {
    if (id.startsWith("webhid")) {
      return TransportWebHID.create();
    }
    return null;
  },

  disconnect: (id) =>
    id.startsWith("webhid")
      ? Promise.resolve() // nothing to do
      : null,
});

function init() {
  const appContainer = document.querySelector("#app-container");
  if (!appContainer) {
    throw new Error("Can not find #app-container");
  }
  const root = createRoot(appContainer);
  root.render(<Newtab />);
}

init();
