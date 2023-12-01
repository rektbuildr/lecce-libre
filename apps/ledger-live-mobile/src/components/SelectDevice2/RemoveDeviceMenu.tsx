import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

import Button from "../Button";

import NanoS from "LLM@images/devices/NanoS";
import Stax from "LLM@images/devices/Stax";
import NanoX from "LLM@images/devices/NanoX";

import Trash from "LLM@icons/Trash";
import QueuedDrawer from "../QueuedDrawer";
import { removeKnownDevice } from "LLM@actions/ble";

const illustrations = {
  [DeviceModelId.nanoS]: NanoS,
  [DeviceModelId.nanoSP]: NanoS,
  [DeviceModelId.nanoX]: NanoX,
  [DeviceModelId.blue]: NanoS,
  [DeviceModelId.stax]: Stax,
};

const RemoveDeviceMenu = ({
  onHideMenu,
  device,
  open,
}: {
  onHideMenu: () => void;
  device: Device;
  open: boolean;
}) => {
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const illustration = useMemo(
    () =>
      (illustrations[device.modelId] ?? NanoX)({
        color: colors.neutral.c100,
        size: 200,
        theme: colors.type as "light" | "dark",
      }),
    [device.modelId, colors],
  );

  const onRemoveDevice = useCallback(async () => {
    dispatch(removeKnownDevice(device.deviceId));
    onHideMenu();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await disconnect(device.deviceId).catch(() => {});
  }, [device, dispatch, onHideMenu]);

  return (
    <QueuedDrawer isRequestingToBeOpened={open} onClose={onHideMenu}>
      <Flex alignItems="center" mb={8}>
        {illustration}
      </Flex>
      <Button
        event="HardResetModalAction"
        type="alert"
        IconLeft={Trash}
        title={<Trans i18nKey="common.forgetDevice" />}
        onPress={onRemoveDevice}
      />
    </QueuedDrawer>
  );
};

export default RemoveDeviceMenu;
