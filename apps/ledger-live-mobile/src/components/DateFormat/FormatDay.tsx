import React from "react";
import { useSelector } from "react-redux";
import { differenceInCalendarDays } from "date-fns";
import { createSelector } from "reselect";
import { useTranslation } from "react-i18next";
import compareDate from "LLM@logic/compareDate";
import { dateFormatSelector, languageSelector } from "LLM@reducers/settings";
import { ddmmyyyyFormatter, Format, genericFormatter, mmddyyyyFormatter } from "./formatter.util";

type Props = {
  day: Date;
};

const localeDateTimeFormatSelector = createSelector(languageSelector, language =>
  genericFormatter(language),
);

const FormatDay = ({ day }: Props) => {
  const { t } = useTranslation();
  const dateTimeFormat = useSelector(localeDateTimeFormatSelector);
  const dateFormat = useSelector(dateFormatSelector);

  const dateFormatOptions =
    dateFormat === Format.default
      ? dateTimeFormat
      : dateFormat === Format.ddmmyyyy
      ? ddmmyyyyFormatter
      : mmddyyyyFormatter;

  const dayDiff = differenceInCalendarDays(Date.now(), day);
  const suffix =
    dayDiff === 0 ? ` - ${t("common.today")}` : dayDiff === 1 ? ` - ${t("common.yesterday")}` : "";
  const formattedDate = dateFormatOptions.format(day);

  return (
    <>
      {formattedDate}
      {suffix}
    </>
  );
};

export default React.memo(FormatDay, (prevProps, newProps) =>
  compareDate(prevProps.day, newProps.day),
);
