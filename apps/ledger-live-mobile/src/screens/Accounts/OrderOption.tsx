import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Checkbox, Text } from "@ledgerhq/native-ui";
import { useRefreshAccountsOrdering } from "LLM@actions/general";
import { setOrderAccounts } from "LLM@actions/settings";
import { orderAccountsSelector } from "LLM@reducers/settings";
import Touchable from "LLM@components/Touchable";

type Props = {
  id: string;
};

const StyledTouchableRow = styled(Touchable)`
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  margin-bottom: ${p => p.theme.space[8]}px;
`;

export default function OrderOption({ id }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const orderAccounts = useSelector(orderAccountsSelector);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  const onPress = useCallback(() => {
    dispatch(setOrderAccounts(`${id}`));
    refreshAccountsOrdering();
  }, [dispatch, id, refreshAccountsOrdering]);

  const selected = orderAccounts === id;
  return (
    <StyledTouchableRow
      event="AccountOrderOption"
      eventProperties={{ accountOrderId: id }}
      onPress={onPress}
    >
      <Text
        variant={"body"}
        fontWeight={"semiBold"}
        color={selected ? "primary.c80" : "neutral.c100"}
      >
        {t(`orderOption.choices.${id}`)}
      </Text>
      {selected && <Checkbox checked={true} />}
    </StyledTouchableRow>
  );
}
