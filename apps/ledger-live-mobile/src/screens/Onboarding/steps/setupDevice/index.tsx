import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "LLM@const";
import Illustration from "LLM@images/illustration/Illustration";
import BaseStepperView, {
  Intro,
  Instructions,
  PinCode,
  PinCodeInstructions,
  RecoveryPhrase,
  RecoveryPhraseInstructions,
  RecoveryPhraseSetup,
  HideRecoveryPhrase,
} from "./scenes";
import { TrackScreen } from "LLM@analytics";
import StepLottieAnimation from "./scenes/StepLottieAnimation";
import { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "LLM@components/RootNavigator/types/OnboardingNavigator";
import { Step } from "./scenes/BaseStepperView";

// @TODO Replace
const images = {
  light: {
    Intro: require("LLM@images/illustration/Light/_052.png"),
    Instructions: require("LLM@images/illustration/Light/_052.png"),
    PinCode: require("LLM@images/illustration/Light/_062.png"),
    PinCodeInstructions: require("LLM@images/illustration/Light/_062.png"),
    RecoveryPhrase: require("LLM@images/illustration/Light/_061.png"),
    RecoveryPhraseInstructions: require("LLM@images/illustration/Light/_061.png"),
    RecoveryPhraseSetup: require("LLM@images/illustration/Light/_057.png"),
    HideRecoveryPhrase: require("LLM@images/illustration/Light/_057.png"),
  },
  dark: {
    Intro: require("LLM@images/illustration/Dark/_052.png"),
    Instructions: require("LLM@images/illustration/Dark/_052.png"),
    PinCode: require("LLM@images/illustration/Dark/_062.png"),
    PinCodeInstructions: require("LLM@images/illustration/Dark/_062.png"),
    RecoveryPhrase: require("LLM@images/illustration/Dark/_061.png"),
    RecoveryPhraseInstructions: require("LLM@images/illustration/Dark/_061.png"),
    RecoveryPhraseSetup: require("LLM@images/illustration/Dark/_057.png"),
    HideRecoveryPhrase: require("LLM@images/illustration/Dark/_057.png"),
  },
};

type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

const scenes = [
  Intro,
  Instructions,
  PinCode,
  PinCodeInstructions,
  RecoveryPhrase,
  RecoveryPhraseInstructions,
  RecoveryPhraseSetup,
  HideRecoveryPhrase,
] as Step[];

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingSetNewDevice
>;

function OnboardingStepNewDevice() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { theme } = useTheme();
  const route = useRoute<NavigationProps["route"]>();

  const { deviceModelId } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: Intro.id,
        // @TODO: Replace this placeholder with the correct illustration asap
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.Intro}
            lightSource={images.light.Intro}
          />
        ),
        drawer: null,
      },
      {
        id: Instructions.id,
        illustration: (
          <StepLottieAnimation
            stepId="powerOn"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: null,
      },
      {
        id: PinCode.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.PinCode}
            lightSource={images.light.PinCode}
          />
        ),
        drawer: null,
      },
      {
        id: PinCodeInstructions.id,
        illustration: (
          <StepLottieAnimation
            stepId="pinCode"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingSetupDeviceInformation,
          screen: ScreenName.OnboardingSetupDeviceInformation,
        },
      },
      {
        id: RecoveryPhrase.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.RecoveryPhrase}
            lightSource={images.light.RecoveryPhrase}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: RecoveryPhraseInstructions.id,
        illustration: (
          <StepLottieAnimation
            stepId="numberOfWords"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: RecoveryPhraseSetup.id,
        illustration: (
          <StepLottieAnimation
            stepId="confirmWords"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: HideRecoveryPhrase.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.HideRecoveryPhrase}
            lightSource={images.light.HideRecoveryPhrase}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingModalSetupSecureRecovery,
          screen: ScreenName.OnboardingModalSetupSecureRecovery,
        },
      },
    ],
    [deviceModelId, theme],
  );

  const nextPage = useCallback(() => {
    navigation.navigate(NavigatorName.OnboardingPreQuiz, {
      screen: ScreenName.OnboardingPreQuizModal,
      params: {
        onNext: () =>
          navigation.navigate(ScreenName.OnboardingQuiz, {
            deviceModelId: route.params.deviceModelId,
          }),
      },
    });
  }, [navigation, route.params]);

  return (
    <>
      <TrackScreen category="Onboarding" name="SetupNewDevice" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
      />
    </>
  );
}

export default memo(OnboardingStepNewDevice);
