import React from "react";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
  userThemeSelector,
} from "~/renderer/reducers/settings";

const DEFAULT_EARN_APP_ID = "earn";

const Earn = () => {
  const theme = useSelector(userThemeSelector);
  const locale = useSelector(localeSelector);
  const lang = useSelector(languageSelector);
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);

  const localManifest = useLocalLiveAppManifest(DEFAULT_EARN_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_EARN_APP_ID);
  const manifest = localManifest || remoteManifest;

  useDeepLinkListener();

  return (
    // TODO: Remove @ts-ignore after Card component be compatible with TS
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Card grow style={{ overflow: "hidden" }} data-test-id="earn-app-container">
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation: false,
            },
          }}
          manifest={manifest}
          inputs={{ theme, lang, currencyTicker, locale }}
        />
      ) : null}
    </Card>
  );
};

export default Earn;
