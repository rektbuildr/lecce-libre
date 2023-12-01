import { useTheme } from "@react-navigation/native";
import React from "react";
import Circle from "LLM@components/Circle";
import FirstLetterIcon from "LLM@components/FirstLetterIcon";
import LedgerLogo from "LLM@icons/LiveLogo";

type Props = {
  size?: number;
  isLedger?: boolean;
  name?: string;
};

const PoolImage = ({ isLedger, size = 64, name }: Props) => {
  const { colors } = useTheme();

  return (
    <Circle crop size={size}>
      {isLedger ? (
        <LedgerLogo size={size * 0.7} color={colors.text} />
      ) : (
        <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
      )}
    </Circle>
  );
};

export default PoolImage;
