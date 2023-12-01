import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "LLM@components/SettingsRow";
import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "LLM@actions/settings";
import { RebootContext } from "LLM@context/Reboot";
import { knownDevicesSelector } from "LLM@reducers/ble";
import { removeKnownDevices } from "LLM@actions/ble";
import { useUnacceptGeneralTerms } from "LLM@logic/terms";

export default function ResetOnboardingStateRow() {
  const dispatch = useDispatch();
  const reboot = useContext(RebootContext);
  const knownDevices = useSelector(knownDevicesSelector);
  const unacceptGeneralTerms = useUnacceptGeneralTerms();
  return (
    <SettingsRow
      hasBorderTop
      title="Reset onboarding state"
      desc="Sets the app as if the onboarding was never completed"
      onPress={() => {
        dispatch(setReadOnlyMode(true));
        dispatch(setHasOrderedNano(false));
        dispatch(completeOnboarding(false));
        dispatch(removeKnownDevices(knownDevices.map(d => d.id)));
        unacceptGeneralTerms();
        requestAnimationFrame(() => {
          reboot();
        });
      }}
    />
  );
}
