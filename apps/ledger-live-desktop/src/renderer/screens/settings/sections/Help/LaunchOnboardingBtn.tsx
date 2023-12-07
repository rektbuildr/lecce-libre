import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Button from "~/renderer/components/Button";

const LaunchOnboardingBtn = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleLaunchOnboarding = useCallback(() => {
    history.push("/onboarding");
  }, [history]);

  return (
    <>
      
      <Button primary small onClick={handleLaunchOnboarding}>
        {t("common.launch")}
      </Button>
    </>
  );
};

export default LaunchOnboardingBtn;
