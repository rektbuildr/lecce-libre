import React, { useCallback, useMemo, useState, useContext } from "react";
import { useSelector } from "react-redux";
import { LayoutChangeEvent, ListRenderItemInfo } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Box, Flex, Button } from "@ledgerhq/native-ui";

import { useTheme } from "styled-components/native";
import {
  isCurrencySupported,
  listTokens,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useRefreshAccountsOrdering } from "LLM@actions/general";
import { counterValueCurrencySelector, hasOrderedNanoSelector } from "LLM@reducers/settings";
import { usePortfolioAllAccounts } from "LLM@hooks/portfolio";

import GraphCardContainer from "../GraphCardContainer";
import TrackScreen from "LLM@analytics/TrackScreen";
import { NavigatorName, ScreenName } from "LLM@const";
import CheckLanguageAvailability from "LLM@components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "LLM@components/CheckTermOfUseUpdate";
import { TAB_BAR_SAFE_HEIGHT } from "LLM@components/TabBar/TabBarSafeAreaView";
import SetupDeviceBanner from "LLM@components/SetupDeviceBanner";
import BuyDeviceBanner, { IMAGE_PROPS_BIG_NANO } from "LLM@components/BuyDeviceBanner";
import Assets from "../Assets";
import { AnalyticsContext } from "LLM@analytics/AnalyticsContext";
import { BaseComposite, StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import FirmwareUpdateBanner from "LLM@components/FirmwareUpdateBanner";
import CollapsibleHeaderFlatList from "LLM@components/WalletTab/CollapsibleHeaderFlatList";
import { WalletTabNavigatorStackParamList } from "LLM@components/RootNavigator/types/WalletTabNavigator";
import { UpdateStep } from "../../FirmwareUpdate";

const maxAssetsToDisplay = 5;

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

function ReadOnlyPortfolio({ navigation }: NavigationProps) {
  const { t } = useTranslation();
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const portfolio = usePortfolioAllAccounts();
  const { colors } = useTheme();
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const goToAssets = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Assets,
    });
  }, [navigation]);

  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () =>
      (listSupportedCurrencies() as (TokenCurrency | CryptoCurrency)[]).concat(
        listSupportedTokens(),
      ),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const topCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.slice(0, maxAssetsToDisplay),
    [sortedCryptoCurrencies],
  );
  const assetsToDisplay = useMemo(
    () =>
      topCryptoCurrencies.slice(0, maxAssetsToDisplay).map(currency => ({
        amount: 0,
        accounts: [],
        currency,
      })),
    [topCryptoCurrencies],
  );

  const data = useMemo(
    () => [
      <Box onLayout={onPortfolioCardLayout} key="GraphCardContainer">
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          showGraphCard
          areAccountsEmpty={false}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
        />
      </Box>,
      ...(hasOrderedNano
        ? [
            <Box mx={6} mt={7} key="SetupDeviceBanner">
              <SetupDeviceBanner screen="Wallet" />
            </Box>,
          ]
        : []),
      <Box background={colors.background.main} px={6} mt={6} key="Assets">
        <Assets assets={assetsToDisplay} />
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seelAllAssets")}
        </Button>
      </Box>,
      ...(!hasOrderedNano
        ? [
            <BuyDeviceBanner
              style={{
                marginHorizontal: 16,
                marginTop: 40,
                paddingTop: 13.5,
                paddingBottom: 13.5,
              }}
              buttonLabel={t("buyDevice.bannerButtonTitle")}
              buttonSize="small"
              event="button_clicked"
              eventProperties={{
                button: "Discover the Nano",
              }}
              screen="Wallet"
              {...IMAGE_PROPS_BIG_NANO}
              key="BuyDeviceBanner"
            />,
          ]
        : []),
    ],
    [
      hasOrderedNano,
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      currentPositionY,
      graphCardEndPosition,
      colors.background.main,
      assetsToDisplay,
      goToAssets,
      t,
    ],
  );

  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  const onBackFromUpdate = useCallback(
    (_updateState: UpdateStep) => {
      navigation.goBack();
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen("Wallet");

      return () => {
        setSource("Wallet");
      };
    }, [setSource, setScreen]),
  );

  return (
    <>
      <Flex px={6} py={4}>
        <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
      </Flex>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen category="Wallet" source={source} />
      <CollapsibleHeaderFlatList<JSX.Element>
        data={data}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        renderItem={({ item }: ListRenderItemInfo<unknown>) => item as JSX.Element}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID="PortfolioReadOnlyList"
      />
    </>
  );
}

export default ReadOnlyPortfolio;
