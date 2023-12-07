import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { setShareAnalytics } from "~/renderer/actions/settings";

import Switch from "~/renderer/components/Switch";
const ShareAnalyticsButton = () => {
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const dispatch = useDispatch();
  const onChangeShareAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setShareAnalytics(value));
    },
    [dispatch],
  );
  return (
    <>
      
      <Switch
        isChecked={shareAnalytics}
        onChange={onChangeShareAnalytics}
        data-e2e="shareAnalytics_button"
      />
    </>
  );
};
export default ShareAnalyticsButton;
