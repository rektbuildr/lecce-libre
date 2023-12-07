import React from "react";

import CountervalueSettingsRow from "./CountervalueSettingsRow";
import ThemeSettingsRow from "./ThemeSettingsRow";
import AuthSecurityToggle from "./AuthSecurityToggle";
import ReportErrorsRow from "./ReportErrorsRow";
import AnalyticsRow from "./AnalyticsRow";
import LanguageRow from "./LanguageRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import DateFormatRow from "./DateFormatRow";

export default function GeneralSettings() {
  return (
    <SettingsNavigationScrollView>
      
      <CountervalueSettingsRow />
      <LanguageRow />
      <DateFormatRow />
      <ThemeSettingsRow />
      <AuthSecurityToggle />
      <ReportErrorsRow />
      <AnalyticsRow />
    </SettingsNavigationScrollView>
  );
}
