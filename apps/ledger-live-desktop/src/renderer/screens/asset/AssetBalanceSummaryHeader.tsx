import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Currency, CryptoCurrency, TokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";

import { setCountervalueFirst } from "~/renderer/actions/settings";
import Box, { Tabbable } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Price from "~/renderer/components/Price";
import PillsDaysCount from "~/renderer/components/PillsDaysCount";

import styled from "styled-components";
import Swap from "~/renderer/icons/Swap";
import Button from "~/renderer/components/ButtonV3";

import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import useStakeFlow from "~/renderer/screens/stake";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { BalanceHistoryWithCountervalue, ValueChange } from "@ledgerhq/types-live";

type Props = {
  isAvailable: boolean;
  cryptoChange: ValueChange;
  countervalueChange: ValueChange;
  last: BalanceHistoryWithCountervalue[0];
  counterValue: Currency;
  countervalueFirst: boolean;
  currency: CryptoCurrency | TokenCurrency;
  unit: Unit;
};
export default function AssetBalanceSummaryHeader({
  counterValue,
  isAvailable,
  last,
  cryptoChange,
  countervalueChange,
  countervalueFirst,
  currency,
  unit,
}: Props) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const history = useHistory();

  const cvUnit = counterValue.units[0];
  const data = useMemo(
    () => [
      {
        valueChange: cryptoChange,
        balance: last.value,
        unit,
      },
      {
        valueChange: countervalueChange,
        balance: last.countervalue,
        unit: cvUnit,
      },
    ],
    [countervalueChange, cryptoChange, cvUnit, last.countervalue, last.value, unit],
  );
  useEffect(() => {
    if (countervalueFirst) {
      data.reverse();
    }
  }, [countervalueFirst, data]);
  const primaryKey = data[0].unit.code;

  const startStakeFlow = useStakeFlow();
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const listFlag = stakeProgramsFeatureFlag?.params?.list ?? [];
  const stakeProgramsEnabled = stakeProgramsFeatureFlag?.enabled ?? false;
  const availableOnStake = stakeProgramsEnabled && currency && listFlag.includes(currency?.id);

  const onBuy = useCallback(() => {
    
    history.push({
      pathname: "/exchange",
      state: {
        currency: currency?.id,
        mode: "buy", // buy or sell
      },
    });
  }, [currency.id, history]);

  const onSwap = useCallback(() => {
    
    
    history.push({
      pathname: "/swap",
      state: {
        defaultCurrency: currency,
      },
    });
  }, [currency, history, null]);

  const onStake = useCallback(() => {
    
    
    startStakeFlow({
      currencies: currency ? [currency.id] : undefined,
    });
  }, [currency, startStakeFlow]);

  return (
    <Box flow={5}>
      <Box horizontal>
        {isAvailable && (
          <SwapButton onClick={() => dispatch(setCountervalueFirst(!countervalueFirst))}>
            <Swap />
          </SwapButton>
        )}
       


        {availableOnStake && (
          <Button variant="color" onClick={onStake} buttonTestId="asset-page-stake-button">
            {t("accounts.contextMenu.stake")}
          </Button>
        )}
      </Box>
      <Box
        key={primaryKey}
        horizontal
        alignItems="center"
        justifyContent={isAvailable ? "space-between" : "flex-end"}
        flow={7}
      >
        
        <PillsDaysCount />
      </Box>
    </Box>
  );
}
const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: row;
`;
const SwapButton = styled(Tabbable).attrs(() => ({
  color: "palette.text.shade100",
  ff: "Inter",
  fontSize: 7,
}))`
  align-items: center;
  align-self: center;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  color: ${p => p.theme.colors.palette.divider};
  cursor: pointer;
  display: flex;
  height: 53px;
  justify-content: center;
  margin-right: 16px;
  width: 25px;

  &:hover {
    border-color: ${p => p.theme.colors.palette.text.shade100};
    color: ${p => p.theme.colors.palette.text.shade100};
  }

  &:active {
    opacity: 0.5;
  }
`;
