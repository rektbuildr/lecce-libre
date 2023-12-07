import React from "react";

import GenericStepConnectDevice from "./GenericStepConnectDevice";
import { StepProps } from "../types";
export default function StepConnectDevice({
  account,
  parentAccount,
  transaction,
  status,
  transitionTo,
  onOperationBroadcasted,
  onTransactionError,
  setSigned,
  isNFTSend,
  onConfirmationHandler,
  onFailHandler,
  currencyName,
}: StepProps) {
  return (
    <>
      
      <GenericStepConnectDevice
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        transitionTo={transitionTo}
        onOperationBroadcasted={onOperationBroadcasted}
        onTransactionError={onTransactionError}
        setSigned={setSigned}
        onConfirmationHandler={onConfirmationHandler}
        onFailHandler={onFailHandler}
      />
    </>
  );
}
