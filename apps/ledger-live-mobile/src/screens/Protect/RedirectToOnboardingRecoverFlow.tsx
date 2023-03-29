import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "../../const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";

type NavigationProps = RootComposite<
  StackNavigatorProps<
    BaseNavigatorStackParamList,
    ScreenName.RedirectToOnboardingRecoverFlow
  >
>;

export function RedirectToOnboardingRecoverFlowScreen() {
  const { navigate, replace } = useNavigation<NavigationProps["navigation"]>();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();

  useEffect(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    replace(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, []);

  return <></>;
}
