/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import Illustration from "LLM@images/illustration/Illustration";

const dark = require("LLM@images/illustration/Dark/_081.png");
const light = require("LLM@images/illustration/Light/_081.png");

export default function Love(
  props: Omit<React.ComponentProps<typeof Illustration>, "darkSource" | "lightSource">,
) {
  return <Illustration darkSource={dark} lightSource={light} size={140} {...props} />;
}
