import React, { useCallback } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { ScreenName } from "LLM@const";
import Touchable from "LLM@components/Touchable";
import type { BaseNavigatorStackParamList } from "LLM@components/RootNavigator/types/BaseNavigator";
import type { AccountsNavigatorParamList } from "LLM@components/RootNavigator/types/AccountsNavigator";

import { Flex } from "@ledgerhq/native-ui";
import { track } from "LLM@analytics";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type Props = {
  currency: CryptoOrTokenCurrency;
};
export default function AccountHeaderLeft({ currency }: Props) {
  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  const navigation =
    useNavigation<
      NavigationProp<AccountsNavigatorParamList & BaseNavigatorStackParamList, ScreenName.Account>
    >();

  const onBackButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Account",
    });
    navigation.goBack();
  }, [navigation]);

  return (
    <Flex flexDirection={"row"}>
      <Touchable onPress={onBackButtonPress}>
        <ArrowLeftMedium size={24} />
      </Touchable>
      {isWalletConnectActionDisplayable && <Flex ml={7} width={24} />}
    </Flex>
  );
}
