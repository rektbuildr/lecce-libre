import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BaseComposite } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";
import { useIncrementOnNavigationFocusState } from "../../helpers/useIncrementOnNavigationFocusState";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/types/SyncOnboardingNavigator";
import DeviceSetupView from "../../components/DeviceSetupView";
import BleDevicePairingFlow from "../../components/BleDevicePairingFlow";

type Props = BaseComposite<
  StackScreenProps<
    SyncOnboardingStackParamList,
    ScreenName.SyncOnboardingBleDevicePairingFlow
  >
>;

const BleDevicePairingFlowScreen = ({ navigation, route }: Props) => {
  const { filterByDeviceModelId } = route.params;

  // Makes sure the pairing components are reset when navigating back to this screen
  const keyToReset =
    useIncrementOnNavigationFocusState<Props["navigation"]>(navigation);

  const onPairingSuccess = useCallback(
    (device: Device) => {
      navigation.navigate(ScreenName.SyncOnboardingCompanion, { device });
    },
    [navigation],
  );

  // TODO: double arrow back from onGoBackFromScanning + close button on pairing
  return (
    <DeviceSetupView hasBackButton>
      <Flex px={6} flex={1}>
        <BleDevicePairingFlow
          onGoBackFromScanning={navigation.goBack}
          key={keyToReset}
          filterByDeviceModelId={filterByDeviceModelId}
          areKnownDevicesDisplayed={true}
          onPairingSuccess={onPairingSuccess}
          onPairingSuccessAddToKnownDevices={false}
        />
      </Flex>
    </DeviceSetupView>
  );
};

export default BleDevicePairingFlowScreen;
