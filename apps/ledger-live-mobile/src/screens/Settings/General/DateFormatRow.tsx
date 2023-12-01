import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import SettingsRow from "LLM@components/SettingsRow";
import { DateFormatDrawer } from "./DateFormatDrawer";
import { track } from "LLM@analytics";
import { ScreenName } from "LLM@const";
import { dateFormatSelector } from "LLM@reducers/settings";
import { Format } from "LLM@components/DateFormat/formatter.util";

const DateFormatRow = () => {
  const [isOpen, setModalOpen] = useState<boolean>(false);

  const dateFormat = useSelector(dateFormatSelector);

  const onClick = useCallback(() => {
    track("button_clicked", {
      button: "Date format",
      page: ScreenName.SettingsScreen,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const { t } = useTranslation();

  return (
    <>
      <SettingsRow
        title={t("settings.display.dateFormat")}
        desc={t("settings.display.dateFormatDesc")}
        arrowRight
        onPress={onClick}
        testID="data-format-button"
      >
        <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
          {dateFormat === Format.default
            ? t("settings.display.DateFormatModal.default")
            : dateFormat}
        </Text>
      </SettingsRow>

      <DateFormatDrawer isOpen={isOpen} closeModal={closeModal} />
    </>
  );
};

export default DateFormatRow;
