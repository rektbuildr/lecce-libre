import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordAddFlowParamList } from "LLM@components/RootNavigator/types/PasswordAddFlowNavigator";
import { StackNavigatorProps } from "LLM@components/RootNavigator/types/helpers";
import { ScreenName } from "LLM@const";
import PasswordForm from "./PasswordForm";

type Props = StackNavigatorProps<PasswordAddFlowParamList, ScreenName.PasswordAdd>;

const PasswordAdd = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const onChange = (password: string) => setPassword(password);

  const onSubmit = () => {
    if (!password) return;
    navigation.navigate(ScreenName.ConfirmPassword, {
      password,
    });
  };

  return (
    <PasswordForm
      placeholder={t("auth.addPassword.placeholder")}
      onChange={onChange}
      onSubmit={onSubmit}
      value={password}
    />
  );
};

export default PasswordAdd;
