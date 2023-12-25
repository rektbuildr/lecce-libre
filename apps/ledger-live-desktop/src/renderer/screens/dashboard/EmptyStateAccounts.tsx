import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import NoAccounts from "./NoAccountsImage";
import Text from "~/renderer/components/Text";
import LinkHelp from "~/renderer/components/LinkHelp";
import { openURL } from "~/renderer/linking";
import { DefaultTheme, withTheme } from "styled-components";
import FakeLink from "~/renderer/components/FakeLink";
import { openModal } from "~/renderer/actions/modals";
import { useDynamicUrl } from "~/renderer/terms";

const EmptyStateAccounts = ({ theme }: { theme: DefaultTheme }) => {
  const { push } = useHistory();
  const { t } = useTranslation();

  const urlFaq = useDynamicUrl("faq");

  const handleInstallApp = useCallback(() => {
    push("/manager");
  }, [push]);
  const dispatch = useDispatch();
  const openAddAccounts = useCallback(() => {
    dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
  }, [dispatch]);
  return (
    <Box
      alignItems="center"
      pb={8}
      style={{
        margin: "auto",
      }}
    >
      <Box mt={5} alignItems="center">
  
        <FakeLink
          underline
          fontSize={10}
          color="palette.text.shade80"
          onClick={handleInstallApp}
          data-e2e="accounts_empty_InstallApps"
        >
          {t("emptyState.accounts.buttons.installApp")}
        </FakeLink>

      </Box>
    </Box>
  );
};
export default React.memo<{}>(withTheme(EmptyStateAccounts));
