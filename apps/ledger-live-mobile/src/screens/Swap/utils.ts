import { useCallback } from "react";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";

export const SWAP_VERSION = "2.34";

export const sharedSwapTracking = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
};

export const useTrackSwapError = () => {
  return useCallback(
    (error: Error, properties = {}) => {
      if (!error) return;
      if (error instanceof SwapExchangeRateAmountTooLow) {

      }
      if (error instanceof NotEnoughBalance) {

      }
    },
    [null],
  );
};
