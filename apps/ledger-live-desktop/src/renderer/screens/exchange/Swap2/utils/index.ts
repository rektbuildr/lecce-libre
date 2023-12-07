import { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";

export const SWAP_VERSION = "2.35";

export const useGetSwapTrackingProperties = () => {
  const ptxSwapMoonpayProviderFlag = useFeature("ptxSwapMoonpayProvider");
  return useMemo(
    () => ({
      swapVersion: SWAP_VERSION,
      flow: "swap",
      ptxSwapMoonpayProviderEnabled: !!ptxSwapMoonpayProviderFlag?.enabled,
    }),
    [ptxSwapMoonpayProviderFlag?.enabled],
  );
};

export const useRedirectToSwapHistory = () => {
  const history = useHistory();
  return useCallback(
    ({
      swapId,
    }: {
      swapId?: string;
    } = {}) => {
      history.push({
        pathname: "/swap/history",
        state: {
          swapId,
        },
      });
    },
    [history],
  );
};

export const trackSwapError = (error: Error, properties: Record<string, unknown> = {}) => {
  if (!error) return;
  if (error instanceof SwapExchangeRateAmountTooLow) {
    
  }
  if (error instanceof NotEnoughBalance) {
    
  }
};
