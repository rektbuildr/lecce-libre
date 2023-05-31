import { Middleware } from "redux";
import { subjectWallet } from "./../App";

const walletSyncMiddleware: Middleware = store => next => action => {
  if (action.type === "INIT_WALLET_SYNC")
    subjectWallet.subscribe({
      next: _value => {
        console.log(_value);
      },
    });

  next(action);
};

export default walletSyncMiddleware;
