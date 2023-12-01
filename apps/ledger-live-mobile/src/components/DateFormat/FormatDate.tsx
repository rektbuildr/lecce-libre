import React from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import compareDate from "LLM@logic/compareDate";
import { dateFormatSelector, languageSelector } from "LLM@reducers/settings";
import { ddmmyyyyFormatter, Format, genericFormatter, mmddyyyyFormatter } from "./formatter.util";

type Props = {
  date: Date | null | undefined;
  withHoursMinutes?: boolean;
};

const defaultOptionsSelector = createSelector(languageSelector, language =>
  genericFormatter(language),
);

const hoursAndMinutesOptionsSelector = createSelector(
  languageSelector,
  language =>
    new Intl.DateTimeFormat(language, {
      hour: "2-digit",
      minute: "2-digit",
    }),
);

function FormatDate({ date, withHoursMinutes = false }: Props): JSX.Element | null {
  const defaultOptions = useSelector(defaultOptionsSelector);

  const hoursAndMinutesOptions = useSelector(hoursAndMinutesOptionsSelector);
  const dateFormat = useSelector(dateFormatSelector);
  const dateFormatOptions =
    dateFormat === Format.default
      ? defaultOptions
      : dateFormat === Format.ddmmyyyy
      ? ddmmyyyyFormatter
      : mmddyyyyFormatter;

  const jsx =
    date && date.getTime()
      ? dateFormatOptions
          .format(date)
          .concat(withHoursMinutes ? ` - ${hoursAndMinutesOptions.format(date)}` : "")
      : null;
  return <>{jsx}</>;
}

function areEqual(prevProps: Props, nextProps: Props): boolean {
  return compareDate(prevProps.date, nextProps.date);
}

export default React.memo<Props>(FormatDate, areEqual);
