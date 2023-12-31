import React from "react";
import Svg, { Path, G } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size?: number;
  color?: string;
};
export default function AlertTriangle({ size = 16, color }: Props) {
  const { colors } = useTheme();
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <G id="Group">
          <Path
            d="M6.217,1.188 C6.59490311,0.564573719 7.27097936,0.183803405 8,0.183803405 C8.72902064,0.183803405 9.40509689,0.564573719 9.783,1.188 L15.436,10.625 C15.8071263,11.2673616 15.8085985,12.0586318 15.4398653,12.70237 C15.071132,13.3461083 14.3878488,13.7451505 13.646,13.75 L2.346,13.75 C1.6035504,13.7422431 0.92136012,13.3398671 0.555381149,12.6938401 C0.189402178,12.047813 0.19497167,11.2558161 0.57,10.615 L6.217,1.188 Z"
            id="path-1-path"
            fill={color}
          />
          <Path
            d="M7.502,1.961 L1.862,11.375 C1.75876353,11.5532748 1.75727713,11.7727982 1.85809003,11.9524546 C1.95890293,12.132111 2.14704646,12.245225 2.353,12.25 L13.638,12.25 C13.8433986,12.2481514 14.0326685,12.1383503 14.1362308,11.9609613 C14.2397932,11.7835724 14.2423647,11.564774 14.143,11.385 L8.5,1.962 C8.39449471,1.78762607 8.20558928,1.68100656 8.00178154,1.68080214 C7.79797381,1.68059772 7.60885487,1.78683806 7.503,1.961 L7.502,1.961 Z"
            id="path-1-path"
            fill="#FFFFFF"
          />
          <Path
            d="M7.25,5 C7.25,4.58578644 7.58578644,4.25 8,4.25 C8.41421356,4.25 8.75,4.58578644 8.75,5 L8.75,7.667 C8.75,8.08121356 8.41421356,8.417 8,8.417 C7.58578644,8.417 7.25,8.08121356 7.25,7.667 L7.25,5 Z"
            id="path-1-path"
            fill={color}
          />
          <Path
            d="M8.75,10 C8.75,10.4142136 8.41421356,10.75 8,10.75 C7.58578644,10.75 7.25,10.4142136 7.25,10 L7.25,9.99 C7.25,9.57578644 7.58578644,9.24 8,9.24 C8.41421356,9.24 8.75,9.57578644 8.75,9.99 L8.75,10 Z"
            id="path-1-path"
            fill={color || colors.yellow}
          />
        </G>
      </G>
    </Svg>
  );
}
