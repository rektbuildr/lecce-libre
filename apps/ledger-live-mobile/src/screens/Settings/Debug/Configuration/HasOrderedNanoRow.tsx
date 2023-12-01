import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "LLM@components/SettingsRow";
import { setHasOrderedNano, setSensitiveAnalytics } from "LLM@actions/settings";
import { hasOrderedNanoSelector } from "LLM@reducers/settings";

const HasOrderedNanoRow = () => {
  const dispatch = useDispatch();
  const hasOrderedNano: boolean = useSelector(hasOrderedNanoSelector);

  const onChange = useCallback(
    (enabled: boolean) => {
      dispatch(setHasOrderedNano(enabled));

      if (enabled) {
        dispatch(setSensitiveAnalytics(true));
      }
    },
    [dispatch],
  );

  return (
    <>
      <SettingsRow
        event="HasOrderedNanoRowRow"
        title="HasOrderedNano mode"
        desc="Toggle HasOrderedNano mode for testing"
      >
        <Switch checked={hasOrderedNano} onChange={onChange} />
      </SettingsRow>
    </>
  );
};

export default HasOrderedNanoRow;
