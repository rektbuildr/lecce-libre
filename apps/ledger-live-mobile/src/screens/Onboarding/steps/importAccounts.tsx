import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useDispatch } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import Illustration from "LLM@images/illustration/Illustration";
import { NavigatorName, ScreenName } from "LLM@const";
import BaseStepperView, { SyncDesktop, Metadata } from "./setupDevice/scenes";
import { TrackScreen } from "LLM@analytics";

import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "LLM@actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";
import { RootComposite, StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "LLM@components/RootNavigator/types/OnboardingNavigator";
import { RootStackParamList } from "LLM@components/RootNavigator/types/RootNavigator";
import { Step } from "./setupDevice/scenes/BaseStepperView";

const images = {
  light: {
    Intro: require("LLM@images/illustration/Light/_074.png"),
  },
  dark: {
    Intro: require("LLM@images/illustration/Dark/_074.png"),
  },
};

const scenes = [SyncDesktop, SyncDesktop] as Step[];

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingImportAccounts>
>;

function OnboardingStepPairNew() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const deviceModelId = route?.params?.deviceModelId;

  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const metadata: Array<Metadata> = [
    {
      id: SyncDesktop.id,
      // @TODO: Replace this placeholder with the correct illustration asap
      illustration: (
        <Illustration size={200} darkSource={images.dark.Intro} lightSource={images.light.Intro} />
      ),
      drawer: null,
    },
  ];

  const onFinish = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(false));
    dispatch(setHasOrderedNano(false));
    resetCurrentStep();

    const parentNav = navigation.getParent<StackNavigationProp<RootStackParamList>>();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, navigation, resetCurrentStep]);

  const nextPage = useCallback(() => {
    navigation.navigate(NavigatorName.ImportAccounts, {
      screen: ScreenName.ScanAccounts,
      params: {
        onFinish,
      },
    });
  }, [navigation, onFinish]);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
      />
    </>
  );
}

export default OnboardingStepPairNew;
