import React, { useCallback } from "react";
import { TouchableOpacity, Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import NoResultsFound from "../../icons/NoResultsFound";

import useRatings from "../../logic/ratings";
import { urls } from "@utils/urls";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: () => void;
  setStep: (name: string) => void;
};

const Disappointed = ({ closeModal, setStep }: Props) => {
  const { t } = useTranslation();
  const { ratingsFeatureParams, ratingsHappyMoment } = useRatings();
  const goToDisappointedForm = useCallback(() => {
    
    setStep("disappointedForm");
  }, [ratingsFeatureParams, ratingsHappyMoment?.route_name, setStep]);
  const onNotNow = useCallback(() => {
    
    closeModal();
  }, [closeModal, ratingsFeatureParams, ratingsHappyMoment?.route_name]);
  const goToLink = useCallback(() => {
    Linking.openURL(urls.ratingsContact);
  }, []);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      
      <NoResultsFound />
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        mt={7}
        lineHeight="34.8px"
      >
        <Trans i18nKey="ratings.disappointed.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        mt={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="ratings.disappointed.description" />
      </Text>
      <Link type="main" onPress={goToLink}>
        {t("ratings.disappointed.here")}
      </Link>
      <Flex alignSelf="stretch" mt={6} py={6}>
        <Button onPress={goToDisappointedForm} type="main" size="large">
          <Trans i18nKey="ratings.disappointed.cta.sendFeedback" />
        </Button>
        <NotNowButton onPress={onNotNow}>
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.disappointed.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Disappointed;
