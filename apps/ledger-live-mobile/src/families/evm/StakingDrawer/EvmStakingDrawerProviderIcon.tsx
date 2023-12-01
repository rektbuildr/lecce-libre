import React from "react";
import Kiln from "LLM@icons/Kiln";
import { Lido } from "LLM@icons/Lido";

type Props = {
  icon?: string;
};

export function EvmStakingDrawerProviderIcon({ icon = "" }: Props) {
  const [name] = icon.split(":");

  if (name === "Kiln") {
    return <Kiln size={32} />;
  }
  if (name === "Lido") {
    return <Lido size={32} />;
  }
  return null;
}
