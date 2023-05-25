import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import { saveSettings } from "~/renderer/actions/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { openURL } from "~/renderer/linking";
import { useUpsellURI } from "~/renderer/hooks/recoverFeatureFlag";

const GO_TO_POSTONBOARDING_TIMEOUT = 5000;

const CompletionScreen = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const device = useSelector(getCurrentDevice);
  const protectServicesDesktop = useFeature("protectServicesDesktop");
  const upsellURI = useUpsellURI();

  const handleInitPostOnboarding = useStartPostOnboardingCallback();
  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    const timeout = setTimeout(() => {
      if (protectServicesDesktop?.enabled && device?.modelId === "stax" && upsellURI) {
        openURL(upsellURI);
      }
      handleInitPostOnboarding({
        deviceModelId: device?.modelId || DeviceModelId.nanoX,
        fallbackIfNoAction: () => history.push("/"),
      });
    }, GO_TO_POSTONBOARDING_TIMEOUT);
    return () => {
      clearTimeout(timeout);
    };
  }, [
    device?.modelId,
    dispatch,
    handleInitPostOnboarding,
    history,
    protectServicesDesktop?.enabled,
    upsellURI,
  ]);

  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <DeviceIllustration deviceId={device?.modelId || DeviceModelId.nanoX} />
    </Flex>
  );
};

export default CompletionScreen;
