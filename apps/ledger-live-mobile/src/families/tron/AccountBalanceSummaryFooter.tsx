import React, { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation, Trans } from "react-i18next";
import { getCryptoCurrencyById, toLocaleString } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import InfoModal from "LLM@modals/Info";
import type { ModalInfo } from "LLM@modals/Info";
import FreezeIcon from "LLM@icons/Freeze";
import BandwidthIcon from "LLM@icons/Bandwidth";
import EnergyIcon from "LLM@icons/Energy";
import CurrencyUnitValue from "LLM@components/CurrencyUnitValue";
import InfoItem from "LLM@components/BalanceSummaryInfoItem";
import { localeSelector } from "LLM@reducers/settings";
import Alert from "LLM@components/Alert";
import { urls } from "LLM@utils/urls";

type Props = {
  account: Account;
};
type InfoName = "available" | "frozen" | "bandwidth" | "energy";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const infoCandidates = useInfoCandidates();
  const {
    energy: formattedEnergy,
    bandwidth,
    tronPower,
  } = (account as TronAccount).tronResources || {};
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = bandwidth || {};
  const unit = getAccountUnit(account);
  const formattedBandwidth = useMemo(
    () => freeLimit.plus(gainedLimit).minus(gainedUsed).minus(freeUsed),
    [freeLimit, gainedLimit, gainedUsed, freeUsed],
  );
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);
  return (
    <>
      <Alert type="warning" learnMoreUrl={urls.TronStakingDisable}>
        <Trans i18nKey="tron.voting.warnDisableStakingMessage" />
      </Alert>
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? infoCandidates[infoName] : []}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
      >
        <InfoItem
          title={t("account.availableBalance")}
          onPress={onPressInfoCreator("available")}
          value={<CurrencyUnitValue unit={unit} value={account.spendableBalance} />}
        />
        <InfoItem
          title={t("account.tronFrozen")}
          onPress={onPressInfoCreator("frozen")}
          value={tronPower}
        />
        <InfoItem
          title={t("account.bandwidth")}
          onPress={onPressInfoCreator("bandwidth")}
          value={formattedBandwidth.isZero() ? "-" : toLocaleString(formattedBandwidth, locale)}
        />
        <InfoItem
          title={t("account.energy")}
          onPress={onPressInfoCreator("energy")}
          value={formattedEnergy.isZero() ? "-" : toLocaleString(formattedEnergy, locale)}
          isLast={true}
        />
      </ScrollView>
    </>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!(account as TronAccount).tronResources) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfoCandidates(): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("tron");
  const TronIcon = getCryptoCurrencyIcon(currency);
  invariant(TronIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <TronIcon color={currency.color} size={18} />,
        title: t("tron.info.available.title"),
        description: t("tron.info.available.description"),
      },
    ],
    frozen: [
      {
        Icon: () => <FreezeIcon size={18} />,
        title: t("tron.info.frozen.title"),
        description: t("tron.info.frozen.description"),
      },
    ],
    bandwidth: [
      {
        Icon: () => <BandwidthIcon size={18} />,
        title: t("tron.info.bandwidth.title"),
        description: t("tron.info.bandwidth.description"),
      },
    ],
    energy: [
      {
        Icon: () => <EnergyIcon size={18} />,
        title: t("tron.info.energy.title"),
        description: t("tron.info.energy.description"),
      },
    ],
  };
}
