import React from "react";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import useDateTimeFormat from "~/renderer/hooks/useDateTimeFormat";

import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

const Hour: ThemedComponent<{}> = styled(Text).attrs(() => ({
  color: "palette.text.shade60",
  fontSize: 3,
  ff: "Inter",
}))`
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

type Props =  { date: Date };
const OperationDate = ({ date }: Props) => {
  const dateFormatter = useDateTimeFormat();
  return (
    <Hour>
      <div>{dateFormatter(date)}</div>
    </Hour>
  );
};

export default OperationDate;
