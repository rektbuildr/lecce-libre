import React, { useCallback, useEffect, useState } from "react";
import { Linking, Share, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  makeEmptyTokenAccount,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, Text, IconsLegacy, Button, Box, BannerCard } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import CurrencyIcon from "../../components/CurrencyIcon";
import NavigationScrollView from "../../components/NavigationScrollView";
import ReceiveSecurityModal from "./ReceiveSecurityModal";
import { replaceAccounts } from "../../actions/accounts";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import PreventNativeBack from "../../components/PreventNativeBack";
import byFamily from "../../generated/Confirmation";
import byFamilyPostAlert from "../../generated/ReceiveConfirmationPostAlert";

import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import Clipboard from "@react-native-community/clipboard";
import ConfirmationHeaderTitle from "./ConfirmationHeaderTitle";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { BankMedium } from "@ledgerhq/native-ui/assets/icons";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasClosedWithdrawBannerSelector } from "../../reducers/settings";
import { setCloseWithdrawBanner } from "../../actions/settings";

type ScreenProps = BaseComposite<
  StackNavigatorProps<
    ReceiveFundsStackParamList,
    ScreenName.ReceiveConfirmation | ScreenName.ReceiveVerificationConfirmation
  >
>;

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & ScreenProps;

const StyledTouchableHightlight = styled.TouchableHighlight<BaseStyledProps>``;
const StyledTouchableOpacity = styled.TouchableOpacity<BaseStyledProps>``;

export default function ReceiveConfirmation({ navigation }: Props) {
  const route = useRoute<ScreenProps["route"]>();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  return account ? (
    <ReceiveConfirmationInner
      navigation={navigation}
      route={route}
      account={account as Account | TokenAccount}
      parentAccount={parentAccount ?? undefined}
    />
  ) : null;
}

function ReceiveConfirmationInner({ navigation, route, account, parentAccount }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const verified = route.params?.verified ?? false;
  const [isModalOpened, setIsModalOpened] = useState(true);
  const [hasAddedTokenAccount, setHasAddedTokenAccount] = useState(false);
  const dispatch = useDispatch();
  const depositWithdrawBannerMobile = useFeature("depositWithdrawBannerMobile");
  const insets = useSafeAreaInsets();

  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedWithdrawBanner);

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Verify address",
      page: "Receive Account Qr Code",
    });
    const params = { ...route.params, notSkippable: true };
    setIsModalOpened(false);
    navigation.navigate(ScreenName.ReceiveConnectDevice, params);
  }, [navigation, route.params]);

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const QRContainerSize = QRSize + 16 * 4;

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = route.params?.currency || (account && getAccountCurrency(account));

  const hideBanner = useCallback(() => {
    track("button_clicked", {
      button: "How to withdraw from exchange",
      page: "Receive Account Qr Code",
    });
    dispatch(setCloseWithdrawBanner(true));
    setBanner(false);
  }, [dispatch]);

  const clickLearn = useCallback(() => {
    track("button_clicked", {
      button: "How to withdraw from exchange",
      type: "card",
      page: "Receive Account Qr Code",
    });
    Linking.openURL(depositWithdrawBannerMobile?.params.url);
  }, [depositWithdrawBannerMobile?.params.url]);

  useEffect(() => {
    if (route.params?.createTokenAccount && !hasAddedTokenAccount) {
      const newMainAccount = { ...mainAccount };
      if (
        !newMainAccount.subAccounts ||
        !newMainAccount.subAccounts.find(
          acc => (acc as TokenAccount)?.token?.id === (currency as CryptoOrTokenCurrency).id,
        )
      ) {
        const emptyTokenAccount = makeEmptyTokenAccount(
          newMainAccount as Account,
          currency as TokenCurrency,
        );
        newMainAccount.subAccounts = [...(newMainAccount.subAccounts || []), emptyTokenAccount];

        // @TODO create a new action for adding a single account at a time instead of replacing
        dispatch(
          replaceAccounts({
            scannedAccounts: [newMainAccount as Account],
            selectedIds: [(newMainAccount as Account).id],
            renamings: {},
          }),
        );
        setHasAddedTokenAccount(true);
      }
    }
  }, [currency, route.params?.createTokenAccount, mainAccount, dispatch, hasAddedTokenAccount]);

  useEffect(() => {
    navigation.setOptions({
      //headerTitle: getAccountName(account as AccountLike),
      headerTitle: () => (
        <ConfirmationHeaderTitle accountCurrency={currency}></ConfirmationHeaderTitle>
      ),
    });
  }, [colors, navigation, account, currency]);

  useEffect(() => {
    if (verified && currency) {
      track("Verification Success", {
        currency: currency.name,
        page: "Receive Account Qr Code",
      });
    }
  }, [verified, currency]);

  const onShare = useCallback(() => {
    track("button_clicked", {
      button: "Share address",
      page: "Receive Account Qr Code",
    });
    if (mainAccount?.freshAddress) {
      Share.share({ message: mainAccount?.freshAddress });
    }
  }, [mainAccount?.freshAddress]);

  const onCopyAddress = useCallback(() => {
    if (!mainAccount?.freshAddress) return;
    Clipboard.setString(mainAccount.freshAddress);
    track("button_clicked", {
      button: "Copy address",
      page: "Receive Account Qr Code",
    });
    const options = {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    };

    ReactNativeHapticFeedback.trigger("soft", options);
    pushToast({
      id: `copy-receive`,
      type: "success",
      icon: "success",
      title: t("transfer.receive.addressCopied"),
    });
  }, [mainAccount?.freshAddress, pushToast, t]);

  if (!account || !currency || !mainAccount) return null;

  // check for coin specific UI
  if (currency.type === "CryptoCurrency" && Object.keys(byFamily).includes(currency.family)) {
    const CustomConfirmation =
      currency.type === "CryptoCurrency"
        ? byFamily[currency.family as keyof typeof byFamily]
        : null;
    if (CustomConfirmation) {
      return (
        <CustomConfirmation
          account={mainAccount || account}
          parentAccount={mainAccount}
          {...{ navigation, route }}
        />
      );
    }
  }

  let CustomConfirmationAlert;
  if (
    currency.type === "CryptoCurrency" &&
    Object.keys(byFamilyPostAlert).includes(currency.family)
  ) {
    CustomConfirmationAlert =
      currency.type === "CryptoCurrency"
        ? byFamilyPostAlert[currency.family as keyof typeof byFamilyPostAlert]
        : null;
  }

  return (
    <Flex flex={1} mb={insets.bottom}>
      <PreventNativeBack />
      <NavigationScrollView style={{ flex: 1 }}>
        <TrackScreen
          category="Deposit"
          name="Receive Account Qr Code"
          asset={currency.name}
          network={currency?.parentCurrency?.name}
        />
        <Flex p={0} alignItems="center" justifyContent="center">
          <StyledTouchableHightlight
            activeOpacity={1}
            underlayColor={colors.palette.opacityDefault.c10}
            alignItems="center"
            justifyContent="center"
            width={QRContainerSize}
            p={6}
            mt={10}
            bg={"opacityDefault.c05"}
            borderRadius={2}
            onPress={onCopyAddress}
          >
            <View>
              <Box mb={6}>
                <Text
                  variant={"body"}
                  fontWeight={"semiBold"}
                  textAlign={"center"}
                  numberOfLines={1}
                >
                  {mainAccount.name}
                </Text>
              </Box>
              <Flex
                p={6}
                borderRadius={24}
                position="relative"
                bg="constant.white"
                borderWidth={1}
                borderColor="neutral.c40"
                alignItems="center"
                justifyContent="center"
              >
                <QRCode size={QRSize} value={mainAccount.freshAddress} ecl="H" />
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  width={QRSize * 0.3}
                  height={QRSize * 0.3}
                  bg="constant.white"
                  position="absolute"
                >
                  <CurrencyIcon
                    currency={currency}
                    color={colors.constant.white}
                    bg={getCurrencyColor(currency) || colors.constant.black}
                    size={48}
                    circle
                  />
                </Flex>
              </Flex>
              <Text variant={"body"} fontWeight={"medium"} textAlign={"center"} mt={6}>
                {mainAccount.freshAddress}
              </Text>
            </View>
          </StyledTouchableHightlight>
          <Flex width={QRContainerSize} flexDirection="row" mt={6}>
            <StyledTouchableOpacity
              p={4}
              bg={"opacityDefault.c05"}
              borderRadius={2}
              mr={4}
              onPress={onShare}
            >
              <IconsLegacy.ShareMedium size={20}></IconsLegacy.ShareMedium>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              p={4}
              bg={"opacityDefault.c05"}
              justifyContent={"center"}
              alignItems={"center"}
              flexDirection="row"
              flex={1}
              borderRadius={2}
              onPress={onCopyAddress}
            >
              <IconsLegacy.CopyMedium size={20}></IconsLegacy.CopyMedium>
              <Text variant={"body"} fontWeight={"medium"} pl={3}>
                {t("transfer.receive.receiveConfirmation.copyAdress")}
              </Text>
            </StyledTouchableOpacity>
          </Flex>
          <Flex px={6}>
            <Text
              variant="small"
              fontWeight="medium"
              color="neutral.c70"
              mt={6}
              mb={4}
              textAlign="center"
            >
              {t("transfer.receive.receiveConfirmation.sendWarning", {
                currencyName: currency.name,
                currencyTicker: currency.ticker,
              })}
            </Text>
          </Flex>
          {CustomConfirmationAlert && <CustomConfirmationAlert mainAccount={mainAccount} />}
        </Flex>
      </NavigationScrollView>
      <Flex m={6}>
        <Flex>
          <Button type="main" size="large" onPress={onRetry}>
            {t("transfer.receive.receiveConfirmation.verifyAddress")}
          </Button>

          {depositWithdrawBannerMobile?.enabled && displayBanner && (
            <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
              <Flex pb={insets.bottom} mt={6}>
                <BannerCard
                  typeOfRightIcon="close"
                  title={t("transfer.receive.receiveConfirmation.bannerTitle")}
                  LeftElement={<BankMedium />}
                  onPressDismiss={hideBanner}
                  onPress={clickLearn}
                />
              </Flex>
            </Animated.View>
          )}
        </Flex>
      </Flex>
      {verified ? null : isModalOpened ? <ReceiveSecurityModal onVerifyAddress={onRetry} /> : null}
    </Flex>
  );
}
