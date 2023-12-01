import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

import ValidateError from "LLM@components/ValidateError";
import { TrackScreen } from "LLM@analytics";

import type { StackNavigatorNavigation } from "LLM@components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { ValidationErrorPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const ValidationError = (props: ValidationErrorPropsType) => {
  const { navigation, route } = props;
  const { error } = route.params;
  const { colors } = useTheme();

  const parent = useMemo<StackNavigatorNavigation<BaseNavigatorStackParamList>>(
    () => navigation.getParent(),
    [navigation],
  );

  /*
   * Should the validation fail, close all stacks, on callback click.
   */

  const onClose = useCallback(() => {
    if (parent) {
      parent.pop();
    }
  }, [parent]);

  /*
   * Should the validation fail for whatever reason, go back one stack, on callback.
   */

  const retry = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ElrondUndelegate"
        name="ValidationError"
        flow="stake"
        action="undelegate"
        currency="egld"
      />
      <ValidateError error={error} onRetry={retry} onClose={onClose} />
    </View>
  );
};

export default ValidationError;
