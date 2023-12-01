import React from "react";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { connect } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import { setFilterTokenOperationsZeroAmount } from "LLM@actions/settings";
import SettingsRow from "LLM@components/SettingsRow";
import withEnv from "LLM@logic/withEnv";

type Props = {
  filterTokenOperationsZeroAmountEnabled: boolean;
  setFilterTokenOperationsZeroAmount: (_: boolean) => void;
};

const mapDispatchToProps = {
  setFilterTokenOperationsZeroAmount,
};

function FilterTokenOperationsZeroAmountRow({
  filterTokenOperationsZeroAmountEnabled,
  setFilterTokenOperationsZeroAmount,
  ...props
}: Props) {
  return (
    <SettingsRow
      {...props}
      event="FilterTokenOperationsZeroAmountRow"
      title={<Trans i18nKey="settings.display.filterTokenOperationsZeroAmount" />}
      desc={<Trans i18nKey="settings.display.filterTokenOperationsZeroAmountDesc" />}
    >
      <Switch
        checked={filterTokenOperationsZeroAmountEnabled}
        onChange={setFilterTokenOperationsZeroAmount}
      />
    </SettingsRow>
  );
}

export default compose<React.ComponentType<Record<string, unknown>>>(
  withEnv("FILTER_ZERO_AMOUNT_ERC20_EVENTS", "filterTokenOperationsZeroAmountEnabled"),
  connect(null, mapDispatchToProps),
)(FilterTokenOperationsZeroAmountRow);
