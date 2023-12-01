import React, { useState } from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import Touchable from "LLM@components/Touchable";
import AccountOrderModal from "./AccountOrderModal";
import { useRefreshAccountsOrderingEffect } from "LLM@actions/general";

export default function AccountOrder() {
  const [isOpened, setIsOpened] = useState(false);

  function onPress(): void {
    setIsOpened(true);
  }

  function onClose(): void {
    setIsOpened(false);
  }

  useRefreshAccountsOrderingEffect({ onUnmount: true });

  return (
    <Touchable event="AccountOrderOpen" onPress={onPress}>
      <IconsLegacy.Sort2AltMedium size={24} />
      <AccountOrderModal isOpened={isOpened} onClose={onClose} />
    </Touchable>
  );
}
