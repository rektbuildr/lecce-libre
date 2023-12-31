import React, { useContext } from "react";
import { AnimationContainer } from "../shared";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";
import { PinCodeHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PinCodeHowTo";
import { DeviceModelId } from "@ledgerhq/types-devices";

export const RecoverPinCodeHowTo = PinCodeHowTo;

const RecoverPinCodeHowToAnimation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation
        animation={getDeviceAnimation(
          deviceModelId || DeviceModelId.nanoS,
          "light",
          "recoverWithProtect",
        )}
      />
    </AnimationContainer>
  );
};

RecoverPinCodeHowTo.Illustration = <RecoverPinCodeHowToAnimation />;
