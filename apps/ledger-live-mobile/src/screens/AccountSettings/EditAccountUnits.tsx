import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { accountScreenSelector } from "LLM@reducers/accounts";
import { updateAccount } from "LLM@actions/accounts";
import SettingsRow from "LLM@components/SettingsRow";
import Touchable from "LLM@components/Touchable";
import NavigationScrollView from "LLM@components/NavigationScrollView";
import { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { AccountSettingsNavigatorParamList } from "LLM@components/RootNavigator/types/AccountSettingsNavigator";
import { ScreenName } from "LLM@const";

type NavigationProps = StackNavigatorProps<
  AccountSettingsNavigatorParamList,
  ScreenName.EditAccountUnits
>;

export default function EditAccountUnits({ navigation, route }: NavigationProps) {
  const dispatch = useDispatch();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account?.type === "Account", "account must be a main account");
  const onPressItem = useCallback(
    (item: Unit) => {
      const newAccount = { ...account, unit: item };
      dispatch(updateAccount(newAccount));
      navigation.goBack();
    },
    [account, navigation, dispatch],
  );
  const accountUnits = account.currency.units;
  return (
    <NavigationScrollView>
      <View style={styles.body}>
        <FlatList
          data={accountUnits}
          keyExtractor={(item: Unit) => item.code}
          renderItem={({ item }) => (
            <Touchable
              event="EditAccountUnits"
              eventProperties={{
                currency: account.currency.id,
                unit: item.code,
              }}
              onPress={() => {
                onPressItem(item);
              }}
            >
              <SettingsRow title={item.code} selected={account.unit.code === item.code} compact />
            </Touchable>
          )}
        >
          {account.unit.code}
        </FlatList>
      </View>
    </NavigationScrollView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    padding: 16,
  },
});
