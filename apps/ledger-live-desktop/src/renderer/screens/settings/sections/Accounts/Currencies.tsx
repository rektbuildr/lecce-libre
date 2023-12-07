import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  Currency,
  CryptoCurrency,
  TokenCurrency,
  CryptoOrTokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { cryptoCurrenciesSelector } from "~/renderer/reducers/accounts";

import SelectCurrency from "~/renderer/components/SelectCurrency";
import Box from "~/renderer/components/Box";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import CurrencyRows from "./CurrencyRows";

import { currencySettingsDefaults } from "~/renderer/reducers/settings";
export default function Currencies() {
  const { t } = useTranslation();
  const currencies = useSelector(cryptoCurrenciesSelector);
  const [currency, setCurrency] = useState<CryptoCurrency | TokenCurrency | typeof undefined>();
  const handleChangeCurrency = useCallback(
    (currency?: CryptoOrTokenCurrency | null) => {
      if (currency) {
        setCurrency(currency);
      }
    },
    [setCurrency],
  );
  const currencyId = currency?.id;
  const currencyName = currency?.name;
  const isCurrencyDisabled = useCallback(
    (currency: Currency) => !currencySettingsDefaults(currency).confirmationsNb,
    [],
  );
  return (
    <Box>
      {currencyId && currencyName && (
        <>
          
          
        </>
      )}
      <Row
        title={t("settings.tabs.currencies")}
        desc={t("settings.currencies.desc")}
        contentContainerStyle={{
          cursor: "pointer",
        }}
      >
        <SelectCurrency
          small
          minWidth={260}
          value={currency}
          // Mayday we have a problem with <Select /> and its props
          onChange={handleChangeCurrency}
          currencies={currencies}
          placeholder={t("settings.currencies.selectPlaceholder")}
          isCurrencyDisabled={isCurrencyDisabled}
        />
      </Row>
      {currency && (
        <Body>
          <CurrencyRows currency={currency as CryptoCurrency} />
        </Body>
      )}
    </Box>
  );
}
