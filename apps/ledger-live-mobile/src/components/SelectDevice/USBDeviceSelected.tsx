import React, { useState } from "react";
import { listApps } from "@ledgerhq/live-common/apps/hw";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { GENUINE_CHECK_TIMEOUT } from "@utils/constants";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { from, tap, timeout } from "rxjs";
import { setHasInstalledAnyApp } from "src/actions/settings";
import { hasCompletedOnboardingSelector } from "src/reducers/settings";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import PendingGenuineCheck from "src/screens/PairDevices/PendingGenuineCheck";
import { renderError } from "../DeviceAction/rendering";
import { useTranslation } from "react-i18next";
import { GenericInformationBody } from "../GenericInformationBody";

type Props = {
  device: Device;
  onDone: (device: Device) => void;
};

/** performs a genuine check on the device similar to the one done after BLE pairing in /src/screens/PairDevices/index.tsx*/
const USBDeviceSelected: React.FC<Props> = ({ device, onDone }) => {
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [genuineCheckDone, setGenuineCheckDone] = useState(false);

  const { t } = useTranslation();

  const onRetry = () => setNonce(nonce => nonce + 1);

  useEffect(() => {
    let appsInstalled;
    const subscription = withDevice(device.id)(transport =>
      from(getDeviceInfo(transport)),
    ).subscribe({
      complete: () => onDone(device),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [device, onDone]);

  if (error) {
    return renderError({ error, t, onRetry });
  }

  return <GenericInformationBody></GenericInformationBody>;

  return <PendingGenuineCheck />;
};

export default USBDeviceSelected;
