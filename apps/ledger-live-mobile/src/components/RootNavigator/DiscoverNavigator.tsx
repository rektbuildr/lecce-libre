import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ScreenName } from "LLM@const";
import { getStackNavigatorConfig } from "LLM@navigation/navigatorConfig";
import Discover from "LLM@screens/Discover";
import { Catalog } from "LLM@screens/Platform";
import { DiscoverNavigatorStackParamList } from "./types/DiscoverNavigator";

export default function DiscoverNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const config = useFeature("discover");

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      {(!config?.enabled || config?.params?.version === "1") && (
        <Stack.Screen
          name={ScreenName.DiscoverScreen}
          component={Discover}
          options={{
            headerShown: false,
          }}
        />
      )}
      <Stack.Screen
        name={ScreenName.PlatformCatalog}
        component={Catalog}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<DiscoverNavigatorStackParamList>();
