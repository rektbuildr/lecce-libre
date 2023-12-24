import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "~/renderer/screens/settings/SettingsSection";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";

import Switch from "~/renderer/components/Switch";

export default function FilterTokenOperationsZeroAmount() {
  const [filterTokenOperationsZeroAmount, setFilterTokenOperationsZeroAmount] =
    useFilterTokenOperationsZeroAmount();
  const { t } = useTranslation();

  return (
    <Row
      title={t("settings.accounts.filterTokenOperationsZeroAmount.title")}
      desc={t("settings.accounts.filterTokenOperationsZeroAmount.desc")}
    >

      <Switch
        isChecked={filterTokenOperationsZeroAmount}
        onChange={setFilterTokenOperationsZeroAmount}
        data-e2e="filterTokenOperationsZeroAmount_button"
      />
    </Row>
  );
}
