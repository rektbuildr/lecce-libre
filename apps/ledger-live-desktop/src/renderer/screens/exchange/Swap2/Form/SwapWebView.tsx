import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer, { SwapLiveError } from "./WebviewErrorDrawer/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import useTheme from "~/renderer/hooks/useTheme";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { SwapOperation } from "@ledgerhq/types-live/lib/swap";
import BigNumber from "bignumber.js";
import { SubAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

type CustomHandlersParams<Params> = {
  params: Params;
};

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromTokenId: string;
  toAccountId: string;
  toTokenId: string;
  fromAmount: string;
  fromAmountWei: string;
  toAmountWei?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
};

export type SwapWebProps = {
  swapState?: Partial<SwapProps>;
  redirectToProviderApp(_: string): void;
};

export const SWAP_WEB_MANIFEST_ID = "swap-live-app-demo-0";

const SwapWebAppWrapper = styled.div<{ isDevelopment: boolean }>(
  ({ isDevelopment }) => `
  ${!isDevelopment ? "height: 0px;" : ""}
  width: 100%;
`,
);

const SwapWebView = ({ swapState, redirectToProviderApp }: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();
  const dispatch = useDispatch();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(SWAP_WEB_MANIFEST_ID);
  const remoteManifest = useRemoteLiveAppManifest(SWAP_WEB_MANIFEST_ID);
  const manifest = localManifest || remoteManifest;

  const hasManifest = !!manifest;
  const hasSwapState = !!swapState;

  const customHandlers = useMemo(() => {
    return {
      ...loggerHandlers,
      "custom.swapStateGet": () => {
        return Promise.resolve(swapState);
      },
      // TODO: when we need bidirectional communication
      // "custom.swapStateSet": (params: CustomHandlersParams<unknown>) => {
      //   return Promise.resolve();
      // },
      "custom.throwExchangeErrorToLedgerLive": ({
        params,
      }: CustomHandlersParams<SwapLiveError>) => {
        onSwapWebviewError(params);
        return Promise.resolve();
      },
      "custom.saveSwapToHistory": (swap: SwapProps, transaction_id: string) => {
        if (
          !swap ||
          !transaction_id ||
          !swap.fromTokenId ||
          !swap.provider ||
          !swap.toTokenId ||
          !swap.fromAmountWei ||
          !swap.toAmountWei
        ) {
          return Promise.reject("cannot save swap missing params");
        }
        const operationId = `${swap.fromTokenId}-${transaction_id}-OUT`;

        const swapOperation: SwapOperation = {
          status: "pending",
          provider: swap.provider,
          operationId,
          swapId: transaction_id,
          // NB We store the reciever main account + tokenId in case the token account doesn't exist yet.
          receiverAccountId: swap.toTokenId,
          tokenId: swap.toTokenId,
          fromAmount: new BigNumber(swap.fromAmountWei),
          toAmount: new BigNumber(swap.toAmountWei),
        };

        dispatch(
          updateAccountWithUpdater(swap.fromTokenId, account => {
            const fromCurrency = getAccountCurrency(account);
            const isFromToken = fromCurrency.type === "TokenCurrency";
            const subAccounts = account.type === "Account" && account.subAccounts;
            return isFromToken && subAccounts
              ? {
                  ...account,
                  subAccounts: subAccounts.map<SubAccount>((a: SubAccount) => {
                    const subAccount = {
                      ...a,
                      swapHistory: [...a.swapHistory, swapOperation],
                    };
                    return a.id === swap.fromTokenId ? subAccount : a;
                  }),
                }
              : { ...account, swapHistory: [...account.swapHistory, swapOperation] };
          }),
        );
        return Promise.resolve();
      },
      "custom.throwGenericErrorToLedgerLive": () => {
        onSwapWebviewError();
        return Promise.resolve();
      },
      "custom.redirectToProviderApp": ({ params }: { params: string }) => {
        redirectToProviderApp(params);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapState?.cacheKey]);

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  if (!hasManifest || !hasSwapState) {
    return null;
  }
  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const isDevelopment = process.env.NODE_ENV === "development";
  return (
    <>
      {isDevelopment && (
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
      )}
      <SwapWebAppWrapper isDevelopment={isDevelopment}>
        <Web3AppWebview
          manifest={manifest}
          inputs={{
            cacheKey: swapState.cacheKey,
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
          }}
          onStateChange={setWebviewState}
          ref={webviewAPIRef}
          customHandlers={customHandlers as never}
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
