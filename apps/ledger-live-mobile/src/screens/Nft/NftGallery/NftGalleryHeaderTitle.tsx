import React, { memo } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { scrollToTop } from "LLM@navigation/utils";
import { AccountsNavigatorParamList } from "LLM@components/RootNavigator/types/AccountsNavigator";
import { ScreenName } from "LLM@const";

type NavigationProps = StackScreenProps<AccountsNavigatorParamList, ScreenName.NftGallery>;

const NftGalleryHeaderTitle = () => {
  const { params } = useRoute<NavigationProps["route"]>();

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
        {params?.title}
      </Text>
    </TouchableWithoutFeedback>
  );
};

export default memo(NftGalleryHeaderTitle);
