import React from "react";
import { useTranslation } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import Button from "LLM@components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.0.title",
    desc: "onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.0.label",
  },
  {
    title: "onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.1.title",
    desc: "onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.1.label",
  },
];

const RecoveryPhraseInstructionsScene = () => {
  const { t } = useTranslation();

  return (
    <NumberedList
      flex={1}
      items={items.map(item => ({
        title: t(item.title),
        description: t(item.desc),
      }))}
    />
  );
};

RecoveryPhraseInstructionsScene.id = "RecoveryPhraseInstructionsScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button type="main" size="large" onPress={onNext}>
      {t("onboarding.stepSetupDevice.recoveryPhraseSetup.nextStep")}
    </Button>
  );
};

RecoveryPhraseInstructionsScene.Next = Next;

export default RecoveryPhraseInstructionsScene;
