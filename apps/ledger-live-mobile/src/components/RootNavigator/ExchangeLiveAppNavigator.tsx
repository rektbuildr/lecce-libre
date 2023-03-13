import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { Icons, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  findCryptoCurrencyByKeyword,
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
} from "@ledgerhq/live-common/currencies/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

import PlatformApp from "../../screens/Platform/App";
import styles from "../../navigation/styles";
import type { ExchangeLiveAppNavigatorParamList } from "./types/ExchangeLiveAppNavigator";
import type { StackNavigatorProps } from "./types/helpers";

const Stack = createStackNavigator<ExchangeLiveAppNavigatorParamList>();

const ExchangeBuy = (
  _props: StackNavigatorProps<
    ExchangeLiveAppNavigatorParamList,
    ScreenName.ExchangeBuy
  >,
) => {
  const navigation = useNavigation();
  const startStakeRequested = _props.route.params?.startStake;

  const listSupportedTokens = useMemo(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies() as (TokenCurrency | CryptoCurrency)[],
    [listSupportedTokens],
  );

  const startStake = () =>
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
              },
            },
          });
          // alert("success");
        },
        // onError: (e: Error) => {
        //   console.log(e);
        //   alert("error");
        // },
      },
    });

  useEffect(() => {
    if (startStakeRequested) {
      startStake();
      navigation.setParams({ startStake: false });
    }
  }, [startStakeRequested]);
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");
  return (
    <PlatformApp
      {..._props}
      route={{
        ..._props.route,
        params: {
          platform: ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
          mode: "buy",
          currency: _props.route.params?.currency
            ? findCryptoCurrencyByKeyword(_props.route.params?.currency)?.id
            : _props.route.params?.defaultCurrencyId,
          account: _props.route.params?.defaultAccountId,
        },
      }}
    />
  );
};

const ExchangeSell = (
  _props: StackNavigatorProps<
    ExchangeLiveAppNavigatorParamList,
    ScreenName.ExchangeSell
  >,
) => {
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");

  return (
    <PlatformApp
      {..._props}
      route={{
        ..._props.route,
        params: {
          platform: ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
          mode: "sell",
          currency: _props.route.params?.currency
            ? findCryptoCurrencyByKeyword(_props.route.params?.currency)?.id
            : _props.route.params?.defaultCurrencyId,
          account: _props.route.params?.defaultAccountId,
        },
      }}
    />
  );
};

export default function ExchangeLiveAppNavigator(
  _props?: Record<string, unknown>,
) {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.ExchangeBuy}
        options={{
          headerBackImage: () => (
            <Flex pl="16px">
              <Icons.CloseMedium color="neutral.c100" size="20px" />
            </Flex>
          ),
          headerStyle: styles.headerNoShadow,
          headerTitle: () => null,
        }}
      >
        {props => <ExchangeBuy {...props} />}
      </Stack.Screen>

      <Stack.Screen
        name={ScreenName.ExchangeSell}
        options={{
          headerBackImage: () => (
            <Flex pl="16px">
              <Icons.CloseMedium color="neutral.c100" size="20px" />
            </Flex>
          ),
          headerStyle: styles.headerNoShadow,
          headerTitle: () => null,
        }}
      >
        {props => <ExchangeSell {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
