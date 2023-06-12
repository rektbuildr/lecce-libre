import React, { useCallback } from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useHistory } from "react-router-dom";

const WithAnimationToggle = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const onNavigateToConfettiScreen = useCallback(() => {
    history.push({
      pathname: "/settings/developer/withAnimation",
    });
  }, [history]);

  return (
    <>
      <Row
        title={t("settings.developer.withAnimation")}
        desc={t("settings.developer.withAnimationDesc")}
      >
        <Button small primary onClick={onNavigateToConfettiScreen}>
          {t("settings.developer.withAnimationCTA")}
        </Button>
      </Row>
    </>
  );
};

export default WithAnimationToggle;
