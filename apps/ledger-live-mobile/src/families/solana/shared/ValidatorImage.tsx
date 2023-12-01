import React from "react";
import { Image } from "react-native";
import Circle from "LLM@components/Circle";
import FirstLetterIcon from "LLM@components/FirstLetterIcon";

type Props = {
  size?: number;
  imgUrl?: string;
  name?: string;
};

const ValidatorImage = ({ imgUrl, size = 64, name }: Props) => (
  <Circle crop size={size}>
    {imgUrl && <Image style={{ width: size, height: size }} source={{ uri: imgUrl }} />}
    {!imgUrl && <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />}
  </Circle>
);

export default ValidatorImage;
