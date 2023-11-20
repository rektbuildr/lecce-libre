import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import Config from "react-native-config";
import { createStackNavigator } from "@react-navigation/stack";
<<<<<<< HEAD
<<<<<<< HEAD
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
=======
import useFeature from "@ledgerhq/live-config/FeatureFlags/useFeature";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
>>>>>>> 5795ae130c (fix: snackcase for folder name)
import { NavigatorName } from "../../const";
import { hasCompletedOnboardingSelector } from "../../reducers/settings";
import BaseNavigator from "./BaseNavigator";
import BaseOnboardingNavigator from "./BaseOnboardingNavigator";
import { RootStackParamList } from "./types/RootNavigator";
import { AnalyticsContextProvider } from "../../analytics/AnalyticsContext";
import { StartupTimeMarker } from "../../StartupTimeMarker";
import { enableListAppsV2 } from "@ledgerhq/live-common/apps/hw";

export default function RootNavigator() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const goToOnboarding = !hasCompletedOnboarding && !Config.SKIP_ONBOARDING;

  const listAppsV2 = useFeature("listAppsV2minor1");
  useEffect(() => {
    if (!listAppsV2) return;
    enableListAppsV2(listAppsV2.enabled);
  }, [listAppsV2]);

  return (
    <StartupTimeMarker>
      <AnalyticsContextProvider>
        <Stack.Navigator
          id={NavigatorName.RootNavigator}
          screenOptions={{
            headerShown: false,
          }}
        >
          {goToOnboarding ? (
            <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          ) : null}
          <Stack.Screen name={NavigatorName.Base} component={BaseNavigator} />
          {hasCompletedOnboarding ? (
            <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          ) : null}
        </Stack.Navigator>
      </AnalyticsContextProvider>
    </StartupTimeMarker>
  );
}
const Stack = createStackNavigator<RootStackParamList>();
