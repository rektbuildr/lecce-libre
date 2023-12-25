import React from "react";
import Svg, { Path, G, Image } from "react-native-svg";
import manager from "@ledgerhq/live-common/manager/index";
import { Flex } from "@ledgerhq/native-ui";
import { App } from "@ledgerhq/types-live";
import AppIcon from "../screens/Manager/AppsList/AppIcon";

type Props = {
  color: string;
  icon: string;
  app: App;
};

export default function AppTree({ color, icon, app }: Props) {

  return (
    <Flex alignItems="center" justifyContent="center">
      <Flex mb={3}>
        <span></span>
      </Flex>
     
    </Flex>
  );
}
