import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName } from "../../const";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";

import QueuedDrawer from "../../components/QueuedDrawer";

import AddAccountsModalCard from "./AddAccountsModalCard";
import { BaseNavigation } from "../../components/RootNavigator/types/helpers";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const syncCryptoImg = require("../../images/illustration/Shared/_SyncFromDesktop.png");

type Props = {
  navigation: BaseNavigation;
  isOpened: boolean;
  onClose: () => void;
  currency?: CryptoCurrency | TokenCurrency | null;
};

export default function AddAccountsModal({ navigation, onClose, isOpened, currency }: Props) {
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onClickAdd = useCallback(() => {
    
    navigation.navigate(NavigatorName.AddAccounts);
    if (currency?.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        token: currency,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
      });
    }
    onClose();
  }, [navigation, currency, onClose]);

  const onClickImport = useCallback(() => {
    
    navigation.navigate(NavigatorName.ImportAccounts);
    onClose();
  }, [navigation, onClose]);

  const onPressClose = useCallback(() => {
    
    onClose();
  }, [onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onPressClose}>
      
      <Text variant="h4" fontWeight="semiBold" fontSize="24px" mb={2}>
        {t("addAccountsModal.title")}
      </Text>
      <Text variant="large" fontWeight="medium" fontSize="14px" color="neutral.c70" mb="32px">
        {t("addAccountsModal.description")}
      </Text>

      {!readOnlyModeEnabled && (
        <AddAccountsModalCard
          title={t("addAccountsModal.add.title")}
          subTitle={t("addAccountsModal.add.description")}
          onPress={onClickAdd}
          imageSource={setupLedgerImg}
          hasMarginBottom
          testID="add-accounts-modal-add-button"
        />
      )}

      <AddAccountsModalCard
        title={t("addAccountsModal.import.title")}
        subTitle={t("addAccountsModal.import.description")}
        onPress={onClickImport}
        imageSource={syncCryptoImg}
      />
    </QueuedDrawer>
  );
}
