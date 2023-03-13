import { Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useStartProfiler } from "@shopify/react-native-performance";
import { GestureResponderEvent, Button as RNButton } from "react-native";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
} from "@ledgerhq/live-common/currencies/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDistribution } from "../../actions/general";
import { TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import {
  blacklistedTokenIdsSelector,
  discreetModeSelector,
} from "../../reducers/settings";
import Assets from "./Assets";

type Props = {
  hideEmptyTokenAccount: boolean;
  openAddModal: () => void;
};

const maxAssetsToDisplay = 5;

const PortfolioAssets = ({ hideEmptyTokenAccount, openAddModal }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const startNavigationTTITimer = useStartProfiler();
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const discreetMode = useSelector(discreetModeSelector);
  const listSupportedTokens = useMemo(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies() as (TokenCurrency | CryptoCurrency)[],
    [listSupportedTokens],
  );

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const assetsToDisplay = useMemo(
    () =>
      distribution.list
        .filter(asset => {
          return (
            asset.currency.type !== "TokenCurrency" ||
            !blacklistedTokenIds.includes(asset.currency.id)
          );
        })
        .slice(0, maxAssetsToDisplay),
    [distribution, blacklistedTokenIds],
  );

  const goToAssets = useCallback(
    (uiEvent: GestureResponderEvent) => {
      startNavigationTTITimer({ source: ScreenName.Portfolio, uiEvent });
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    },
    [startNavigationTTITimer, navigation],
  );

  return (
    <>
      <TrackScreen
        category="Wallet"
        accountsLength={distribution.list && distribution.list.length}
        discreet={discreetMode}
      />
      <RNButton
        title="Staking flow"
        onPress={() => {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectCrypto,
            params: {
              currencies: cryptoCurrencies,
              allowAddAccount: true,
              onSuccess: (account: AccountLike, parentAccount?: Account) => {
                navigation.navigate(NavigatorName.Base, {
                  screen: NavigatorName.NoFundsFlow,
                  params: {
                    screen: ScreenName.NoFunds,
                    params: {
                      account,
                      parentAccount,
                    }
                  }
                });
              },
            },
          });
        }}
      />
      <Assets assets={assetsToDisplay} />

      {distribution.list.length < maxAssetsToDisplay ? (
        <Button
          type="shade"
          size="large"
          outline
          mt={6}
          iconPosition="left"
          Icon={Icons.PlusMedium}
          onPress={openAddModal}
        >
          {t("account.emptyState.addAccountCta")}
        </Button>
      ) : (
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seelAllAssets")}
        </Button>
      )}
    </>
  );
};

export default React.memo(PortfolioAssets);
