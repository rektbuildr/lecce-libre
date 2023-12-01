import React from "react";
import HeaderTitle from "LLM@components/HeaderTitle";
import styles from "./styles";

export default {
  headerTransparent: true,
  headerStyle: [styles.header, styles.transparentHeader],
  headerTitle: () => <HeaderTitle />,
};
