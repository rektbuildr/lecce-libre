import React, { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getDeviceModel } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import AllowManagerDrawer from "./AllowManagerDrawer";
import GenuineCheckFailedDrawer from "./GenuineCheckFailedDrawer";
import { track } from "../../analytics";
import FirmwareUpdateAvailableDrawer from "./FirmwareUpdateAvailableDrawer";
import { urls } from "../../config/urls";
import { LanguagePrompt } from "./LanguagePrompt";
import { NavigatorName, ScreenName } from "../../const";
import type { UpdateStep } from "../FirmwareUpdate";
import EarlySecurityCheckBody from "./EarlySecurityCheckBody";

const LOCKED_DEVICE_TIMEOUT_MS = 1000;

// Represents the UI status of each check step, used by CheckCard
export type UiCheckStatus =
  | "inactive"
  | "active"
  | "completed"
  | "genuineCheckRefused"
  | "firmwareUpdateRefused"
  | "failed";

export type Step = "idle" | "genuine-check" | "firmware-update-check" | "firmware-updating";

// Represents the status of the genuine check from which is derived the displayed UI and if the genuine check hook can be started or not
// TODO: no skipped anymore
type GenuineCheckStatus = "unchecked" | "ongoing" | "completed" | "failed" | "skipped";
// Defines which drawer should be displayed during the genuine check
type GenuineCheckUiDrawerStatus = "none" | "allow-manager" | "genuine-check-failed";

// Represents the status of the firmware check from which is derived the displayed UI and if the genuine check hook can be started or not
type FirmwareUpdateCheckStatus =
  | "unchecked"
  | "ongoing"
  | "updating"
  | "completed"
  | "failed"
  | "refused";
// Defines which drawer should be displayed during the firmware check
type FirmwareUpdateUiDrawerStatus = "none" | "new-firmware-available";

export type EarlySecurityCheckProps = {
  /**
   * A `Device` object
   */
  device: Device;

  /**
   * Function called once the ESC step is finished
   */
  notifyOnboardingEarlyCheckEnded: () => void;

  /**
   * Called when the device is not in a correct state anymore, for ex when a firmware update has completed and the device probably restarted
   */
  notifyEarlySecurityCheckShouldReset: (currentState: { isAlreadyGenuine: boolean }) => void;

  /**
   * To tell the ESC that there is no need to do a genuine check (optional)
   *
   * This will bypass the (idle and) genuine check step and go directly to the firmware update check.
   * Only useful when the EarlySecurityCheck component is mounting.
   */
  isAlreadyGenuine?: boolean;
};

/**
 * Component representing the early security checks step, which polls the current device state
 * to display correctly information about the onboarding to the user
 */
export const EarlySecurityCheck: React.FC<EarlySecurityCheckProps> = ({
  device,
  notifyOnboardingEarlyCheckEnded,
  notifyEarlySecurityCheckShouldReset,
  isAlreadyGenuine = false,
}) => {
  // const navigation = useNavigation<SyncOnboardingScreenProps["navigation"]>();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  // If the device is genuine, puts the current step to `genuine-check` and it will automatically go to next step
  // as the `genuineCheckStatus` is also set as `completed`.
  const [currentStep, setCurrentStep] = useState<Step>(isAlreadyGenuine ? "genuine-check" : "idle");

  // Genuine check status state from which will be derived the displayed UI and if the genuine check hook can be started / is ongoing etc.
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<GenuineCheckStatus>(
    isAlreadyGenuine ? "completed" : "unchecked",
  );

  const [firmwareUpdateCheckStatus, setFirmwareUpdateCheckStatus] =
    useState<FirmwareUpdateCheckStatus>("unchecked");

  // Not a real "device action" but we get: permission requested, granted and result.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing",
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs: LOCKED_DEVICE_TIMEOUT_MS,
  });

  const {
    state: {
      firmwareUpdateContext: latestFirmware,
      deviceInfo,
      error: getLatestAvailableFirmwareError,
      status: getLatestAvailableFirmwareStatus,
      lockedDevice: getLatestAvailableFirmwareLockedDevice,
    },
  } = useGetLatestAvailableFirmware({
    isHookEnabled: firmwareUpdateCheckStatus === "ongoing",
    deviceId: device.deviceId,
  });

  console.log(`🦕 !
    Firmware update check input: ${JSON.stringify({
      isHookEnabled: firmwareUpdateCheckStatus === "ongoing",
      deviceId: device.deviceId,
    })}
    \n
    Firmware update check output: ${JSON.stringify({
      error: getLatestAvailableFirmwareError,
      status: getLatestAvailableFirmwareStatus,
      lockedDevice: getLatestAvailableFirmwareLockedDevice,
      latestFirmware: !!latestFirmware,
    })}
  `);

  const onStartChecks = useCallback(() => {
    setCurrentStep("genuine-check");
  }, []);

  const onGenuineCheckLearnMore = useCallback(() => {
    track("button_clicked", {
      button: "Learn more about Genuine Check",
    });
    Linking.openURL(urls.genuineCheck.learnMore);
  }, []);

  const onRetryGenuineCheck = useCallback(() => {
    track("button_clicked", {
      button: "Run genuine check again",
    });
    resetGenuineCheckState();
    setGenuineCheckStatus("unchecked");
  }, [resetGenuineCheckState]);

  const onSkipFirmwareUpdate = useCallback(() => {
    track("button_clicked", {
      button: "skip software update",
    });

    notifyOnboardingEarlyCheckEnded();
  }, [notifyOnboardingEarlyCheckEnded]);

  const onBackFromUpdate = useCallback(
    (updateState: UpdateStep) => {
      console.log(`🐊 COMING BACK TO ESC: update state = ${updateState}`);
      log("EarlySecurityCheck", "Back from update", { updateState });
      navigation.goBack();

      // In the 3 following cases we resets the ESC:
      // - user left the firmware update flow before the end
      // - the fw update was successful
      // - the user returned after an error during the fw update
      notifyEarlySecurityCheckShouldReset({ isAlreadyGenuine: true });
    },
    [navigation, notifyEarlySecurityCheckShouldReset],
  );

  const onUpdateFirmware = useCallback(() => {
    track("button_clicked", {
      button: "going to software update",
      firmwareUpdate: {
        version: latestFirmware?.final.name,
      },
    });

    if (deviceInfo && latestFirmware) {
      // Resets the `useGetLatestAvailableFirmware` hook to be able to trigger it again
      setFirmwareUpdateCheckStatus("updating");

      // `push` to make sure the screen is added to the navigation stack, if ever the user was on the manager before doing an update, and we can return
      // to this screen with a `goBack`.
      navigation.push(NavigatorName.Base, {
        screen: NavigatorName.Main,
        params: {
          screen: NavigatorName.Manager,
          params: {
            screen: ScreenName.FirmwareUpdate,
            params: {
              device,
              deviceInfo,
              firmwareUpdateContext: latestFirmware,
              onBackFromUpdate,
              isBeforeOnboarding: true,
            },
          },
        },
      });
    }
    // It should never happen
    else {
      log(
        "EarlySecurityCheck",
        `Error: trying to update firmware without a deviceInfo ${JSON.stringify(
          deviceInfo,
        )} or a firmwareUpdateContext: ${JSON.stringify(latestFirmware)}`,
      );
      setFirmwareUpdateCheckStatus("completed");
    }
  }, [device, deviceInfo, latestFirmware, navigation, onBackFromUpdate]);

  // Check steps entry points
  useEffect(() => {
    // Genuine check start and retry entry point
    if (currentStep === "genuine-check" && genuineCheckStatus === "unchecked") {
      setGenuineCheckStatus("ongoing");
    }
    // Firmware update check start point
    else if (
      ["completed", "skipped"].includes(genuineCheckStatus) &&
      currentStep === "genuine-check"
    ) {
      setCurrentStep("firmware-update-check");
      setFirmwareUpdateCheckStatus("ongoing");
    }
  }, [currentStep, genuineCheckStatus]);

  // ***** Handles check states *****
  // UI states
  let currentDisplayedDrawer: GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus = "none";
  let genuineCheckUiStepStatus: UiCheckStatus = "inactive";
  let firmwareUpdateUiStepStatus: UiCheckStatus = "inactive";

  // Handles genuine check states logic (both check state and UI state)
  if (currentStep === "genuine-check") {
    if (genuineCheckStatus === "ongoing") {
      genuineCheckUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the genuineCheckStatus
      if (genuineCheckError) {
        log("EarlySecurityCheck", "Failed to run genuine check:", genuineCheckError.message);
        setGenuineCheckStatus("failed");
      } else if (genuineState === "genuine") {
        setGenuineCheckStatus("completed");
      } else if (genuineState === "non-genuine") {
        setGenuineCheckStatus("failed");
      }

      // Updates the displayed drawer and UI state
      if (devicePermissionState === "unlock-needed") {
        // As the PIN has not been set before the ESC, the "unlock-needed" happens if the device is powered off.
        // But an error `CantOpenDevice` should be triggered quickly after.
        log("EarlySecurityCheck", "Genuine check permission state set to unlock-needed");
      } else if (devicePermissionState === "requested") {
        currentDisplayedDrawer = "allow-manager";
      } else if (devicePermissionState === "refused") {
        // TODO: no drawer
        currentDisplayedDrawer = "none";
        genuineCheckUiStepStatus = "genuineCheckRefused";
        // currentDisplayedDrawer = "genuine-check-failed";
      }
    } else if (genuineCheckStatus === "failed") {
      // Currently genuine check failed or refused is handled in the same way. This can be changed in the future.
      currentDisplayedDrawer = "genuine-check-failed";
    }
  }
  // `currentStep` can be any value for those UI updates
  if (genuineCheckStatus === "completed") {
    genuineCheckUiStepStatus = "completed";
  } else if (genuineCheckStatus === "skipped" || genuineCheckStatus === "failed") {
    // "skipped" represents the user skipping the genuine check because they refused it (on) or it failed
    // TODO: no skipped anymore
    genuineCheckUiStepStatus = "failed";
  }

  // Handles firmware update check UI logic
  if (currentStep === "firmware-update-check") {
    if (firmwareUpdateCheckStatus === "ongoing") {
      firmwareUpdateUiStepStatus = "active";
      currentDisplayedDrawer = "none";

      // Updates the firmwareUpdateCheckStatus
      // If the current error triggered a retry attempt, does not display failure
      if (
        getLatestAvailableFirmwareError &&
        !(
          getLatestAvailableFirmwareError.type === "SharedError" &&
          getLatestAvailableFirmwareError.retrying
        )
      ) {
        log(
          "EarlySecurityCheck",
          "Failed to retrieve latest firmware version with error:",
          getLatestAvailableFirmwareError.name,
        );
        setFirmwareUpdateCheckStatus("failed");
      } else if (getLatestAvailableFirmwareStatus === "no-available-firmware") {
        setFirmwareUpdateCheckStatus("completed");
      }

      if (getLatestAvailableFirmwareLockedDevice) {
        // The device has no PIN in the ESC.
        // Plus if the error is an `UnresponsiveDeviceError`: it would probably means the user
        // cancelled a firmware update previously and came back to the ESC (with a device in an incorrect state).
        log(
          "EarlySecurityCheck",
          "Device considered locked while getting latest available firmware",
          { error: getLatestAvailableFirmwareError },
        );
      }

      // Updates the UI
      if (getLatestAvailableFirmwareStatus === "available-firmware" && latestFirmware) {
        // Only for QA to have always the same 1-way path: on infinite loop firmware
        // the path 1.2.1-il2 -> 1.2.1-il0 does not trigger a firmware update during the ESC
        if (
          getLatestAvailableFirmwareStatus === "available-firmware" &&
          latestFirmware?.final.name === "1.2.1-il0" &&
          deviceInfo?.version === "1.2.1-il2"
        ) {
          setFirmwareUpdateCheckStatus("completed");
          currentDisplayedDrawer = "none";
        } else {
          currentDisplayedDrawer = "new-firmware-available";
        }
      } else {
        currentDisplayedDrawer = "none";
      }
    } else if (firmwareUpdateCheckStatus === "refused") {
      currentDisplayedDrawer = "none";
      firmwareUpdateUiStepStatus = "firmwareUpdateRefused";
    }
  }
  // `currentStep` can be any value for those UI updates
  if (firmwareUpdateCheckStatus === "completed") {
    firmwareUpdateUiStepStatus = "completed";
  } else if (firmwareUpdateCheckStatus === "failed") {
    firmwareUpdateUiStepStatus = "failed";
  }

  // Depends on `currentDisplayedDrawer` because of how the drawer `onClose` works
  const onCloseUpdateAvailable = useCallback(() => {
    // Then we're sure that the user clicks on the close button
    if (currentDisplayedDrawer === "new-firmware-available") {
      setFirmwareUpdateCheckStatus("refused");
    }
  }, [currentDisplayedDrawer]);

  const latestAvailableFirmwareVersion = latestFirmware?.final.version;

  return (
    <>
      <AllowManagerDrawer isOpen={currentDisplayedDrawer === "allow-manager"} device={device} />
      <GenuineCheckFailedDrawer
        productName={productName}
        isOpen={currentDisplayedDrawer === "genuine-check-failed"}
        error={genuineCheckError}
        onRetry={onRetryGenuineCheck}
        onSkip={() => {
          // TODO: to remove -> or to actually go to the sync onboarding
          track("button_clicked", {
            button: "check if hardware genuine later",
            drawer: "Failed Stax hardware check",
          });
          setGenuineCheckStatus("skipped");
        }}
      />
      <FirmwareUpdateAvailableDrawer
        productName={productName}
        firmwareVersion={latestFirmware?.final?.version ?? ""}
        isOpen={currentDisplayedDrawer === "new-firmware-available"}
        onUpdate={onUpdateFirmware}
        onClose={onCloseUpdateAvailable}
      />
      <EarlySecurityCheckBody
        productName={productName}
        currentStep={currentStep}
        onStartChecks={onStartChecks}
        genuineCheckUiStepStatus={genuineCheckUiStepStatus}
        onGenuineCheckLearnMore={onGenuineCheckLearnMore}
        onRetryGenuineCheck={onRetryGenuineCheck}
        firmwareUpdateUiStepStatus={firmwareUpdateUiStepStatus}
        hasLatestAvailableFirmwareStatus={
          getLatestAvailableFirmwareStatus === "available-firmware" &&
          !!latestAvailableFirmwareVersion
        }
        latestAvailableFirmwareVersion={latestAvailableFirmwareVersion}
        notifyOnboardingEarlyCheckEnded={notifyOnboardingEarlyCheckEnded}
        onSkipFirmwareUpdate={onSkipFirmwareUpdate}
        onUpdateFirmware={onUpdateFirmware}
      />
      <LanguagePrompt device={device} />
    </>
  );
};
