import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { setEnablePlatformDevTools } from "~/renderer/actions/settings";

import Switch from "~/renderer/components/Switch";
const EnablePlatformDevToolsToggle = () => {
  const dispatch = useDispatch();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onSetEnablePlatformDevTools = useCallback(
    (checked: boolean) => dispatch(setEnablePlatformDevTools(checked)),
    [dispatch],
  );
  return (
    <>
      
      <Switch
        isChecked={enablePlatformDevTools}
        onChange={onSetEnablePlatformDevTools}
        data-test-id="settings-enable-platform-dev-tools-apps"
      />
    </>
  );
};
export default EnablePlatformDevToolsToggle;
