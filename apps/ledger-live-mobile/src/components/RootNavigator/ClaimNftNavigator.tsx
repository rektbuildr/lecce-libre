import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "LLM@const";
import { getStackNavigatorConfig } from "LLM@navigation/navigatorConfig";
import ClaimNftWelcome from "LLM@screens/ClaimNft/ClaimNftWelcome";
import ClaimNftQrScan from "LLM@screens/ClaimNft/ClaimNftQrScan";
import { ClaimNftNavigatorParamList } from "./types/ClaimNftNavigator";

export default function ClaimNftNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.ClaimNftWelcome}
        component={ClaimNftWelcome}
        options={{ title: "", headerRight: undefined }}
      />
      <Stack.Screen
        name={ScreenName.ClaimNftQrScan}
        component={ClaimNftQrScan}
        options={{ title: "", headerRight: undefined }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ClaimNftNavigatorParamList>();
