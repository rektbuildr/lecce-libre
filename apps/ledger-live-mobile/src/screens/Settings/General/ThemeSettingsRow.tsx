import React, { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Checkbox, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { themeSelector } from "LLM@reducers/settings";
import SettingsRow from "LLM@components/SettingsRow";
import Touchable from "LLM@components/Touchable";
import { setTheme } from "LLM@actions/settings";
import { Theme } from "LLM@reducers/types";
import QueuedDrawer from "LLM@components/QueuedDrawer";

const StyledTouchableThemeRow = styled(Touchable)`
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  margin-bottom: ${p => p.theme.space[8]}px;
`;

export default function ThemeSettingsRow() {
  const { t } = useTranslation();
  const currentTheme = useSelector(themeSelector);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const selectTheme = (theme: Theme) => () => {
    dispatch(setTheme(theme));
  };

  const onClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <SettingsRow
        title={t("settings.display.theme")}
        desc={t("settings.display.themeDesc")}
        arrowRight
        onPress={() => setIsOpen(true)}
      >
        <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
          {t(`settings.display.themes.${currentTheme}`)}
        </Text>
      </SettingsRow>
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={onClose}
        title={t("settings.display.theme")}
      >
        {(["system", "light", "dark"] as Theme[]).map((theme, i) => (
          <StyledTouchableThemeRow
            event="ThemeSettingsRow"
            eventProperties={{ theme }}
            key={theme + i}
            onPress={selectTheme(theme)}
          >
            <Text
              variant={"body"}
              fontWeight={"semiBold"}
              color={currentTheme === theme ? "primary.c80" : "neutral.c100"}
            >
              {t(`settings.display.themes.${theme}`)}
            </Text>
            {currentTheme === theme && <Checkbox checked={true} />}
          </StyledTouchableThemeRow>
        ))}
      </QueuedDrawer>
    </>
  );
}
