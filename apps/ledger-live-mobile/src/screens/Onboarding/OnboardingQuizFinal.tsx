import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenName } from "LLM@const";
import BaseStepperView, { QuizzFinal, Metadata } from "./steps/setupDevice/scenes";
import { TrackScreen } from "LLM@analytics";
import quizProSuccessLight from "LLM@images/illustration/Light/_065.png";
import quizProFailLight from "LLM@images/illustration/Light/_063.png";
import quizProSuccessDark from "LLM@images/illustration/Dark/_065.png";
import quizProFailDark from "LLM@images/illustration/Dark/_063.png";
import Illustration from "LLM@images/illustration/Illustration";
import { RootComposite, StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "LLM@components/RootNavigator/types/OnboardingNavigator";
import { Step } from "./steps/setupDevice/scenes/BaseStepperView";

const scenes = [QuizzFinal, QuizzFinal] as Step[];

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingQuizFinal>
>;

function OnboardingStepQuizFinal() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const { success, deviceModelId } = route.params;

  const [lightSource, darkSource] = useMemo(
    () =>
      success ? [quizProSuccessLight, quizProSuccessDark] : [quizProFailLight, quizProFailDark],
    [success],
  );

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: QuizzFinal.id,
        // @TODO: Replace this placeholder with the correct illustration asap
        illustration: <Illustration size={150} darkSource={darkSource} lightSource={lightSource} />,
        drawer: null,
        success,
      },
    ],
    [darkSource, lightSource, success],
  );

  const nextPage = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingPairNew, {
      deviceModelId: route.params.deviceModelId,
      showSeedWarning: false,
    });
  }, [navigation, route.params]);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
        params={{ success }}
      />
    </>
  );
}

export default memo(OnboardingStepQuizFinal);
