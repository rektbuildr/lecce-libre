import React from "react";

import { getMainAccount } from "@ledgerhq/live-common/account/index";
import GenericStepConnectDevice from "./GenericStepConnectDevice";
import { StepProps } from "../types";
export default function StepConnectDevice({
  account,
  parentAccount,
  transaction,
  status,
  transitionTo,
  useApp,
  onTransactionError,
  onTransactionSigned,
}: StepProps) {
  // Nb setting the mainAccount as a dependency will ensure latest versions of plugins.
  const dependencies = (account && [getMainAccount(account, parentAccount)]) || [];
  return (
    <>
      
      <GenericStepConnectDevice
        account={account}
        useApp={useApp}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        transitionTo={transitionTo}
        onTransactionError={onTransactionError}
        onTransactionSigned={onTransactionSigned}
        dependencies={dependencies}
        requireLatestFirmware
      />
    </>
  );
}
