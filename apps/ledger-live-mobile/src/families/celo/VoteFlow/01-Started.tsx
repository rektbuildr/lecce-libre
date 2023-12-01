import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "LLM@const";
import LText from "LLM@components/LText";

import ExternalLink from "LLM@components/ExternalLink";
import BulletList, { BulletGreenCheck } from "LLM@components/BulletList";
import NavigationScrollView from "LLM@components/NavigationScrollView";
import { urls } from "LLM@utils/urls";
import { TrackScreen } from "LLM@analytics";
import Illustration from "LLM@images/illustration/Illustration";
import EarnLight from "LLM@images/illustration/Light/_003.png";
import EarnDark from "LLM@images/illustration/Dark/_003.png";
import { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { CeloVoteFlowParamList } from "./types";

type Props = StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteStarted>;

export default function VoteStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CeloVoteSummary, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.celoStakingRewards);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="DelegationFlow"
          name="Started"
          flow="stake"
          action="vote"
          currency="celo"
        />
        <Flex alignItems="center" mb={6}>
          <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
        </Flex>
        <Text fontWeight="semiBold" style={styles.description}>
          <Trans i18nKey="celo.vote.flow.steps.starter.description" />
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="celo.vote.flow.steps.starter.bullet.0" key="VoteText1" />,
            <Trans i18nKey="celo.vote.flow.steps.starter.bullet.1" key="VoteText2" />,
            <Trans i18nKey="celo.vote.flow.steps.starter.bullet.2" key="VoteText3" />,
          ].map(wording => (
            <LText semiBold key={wording.key}>
              {wording}
            </LText>
          ))}
        />
        <View style={[styles.howDelegationWorks]}>
          <ExternalLink
            event="DelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer]}>
        <View>
          <Alert type="info" title={t("celo.vote.flow.steps.starter.warning.description")} />
        </View>
        <Button onPress={onNext} type="main" mt={6}>
          <Trans i18nKey="celo.vote.flow.steps.starter.cta" />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rewards: {
    height: 150,
    width: 150,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,

    paddingVertical: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,

    textAlign: "center",
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howDelegationWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,

    flexDirection: "row",
  },
  learnMoreBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
