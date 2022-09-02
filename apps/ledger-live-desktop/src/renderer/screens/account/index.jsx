// @flow

import React, { useCallback, useEffect, useState } from "react";
import { compose } from "redux";
import { connect, useDispatch, useSelector } from "react-redux";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import { Redirect } from "react-router";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { findCompoundToken } from "@ledgerhq/live-common/currencies/index";
import { isNFTActive } from "@ledgerhq/live-common/nft/support";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { accountSelector } from "~/renderer/reducers/accounts";
import {
  isAccountEmpty,
  getAccountCurrency,
  getMainAccount,
  findSubAccountById,
} from "@ledgerhq/live-common/account/index";
import { setCountervalueFirst } from "~/renderer/actions/settings";
import {
  hiddenNftCollectionsSelector,
  countervalueFirstSelector,
} from "~/renderer/reducers/settings";

import TrackPage from "~/renderer/analytics/TrackPage";
import perFamilyAccountBodyHeader from "~/renderer/generated/AccountBodyHeader";
import perFamilyAccountSubHeader from "~/renderer/generated/AccountSubHeader";
import Box from "~/renderer/components/Box";
import OperationsList from "~/renderer/components/OperationsList";
import useTheme from "~/renderer/hooks/useTheme";
import Collections from "~/renderer/screens/nft/Collections";

import BalanceSummary from "./BalanceSummary";
import AccountHeader from "./AccountHeader";
import AccountHeaderActions, { AccountHeaderSettingsButton } from "./AccountHeaderActions";
import EmptyStateAccount from "./EmptyStateAccount";
import TokensList from "./TokensList";
import CompoundBodyHeader from "~/renderer/screens/lend/Account/AccountBodyHeader";
import useCompoundAccountEnabled from "~/renderer/screens/lend/useCompoundAccountEnabled";
import { getBannerProps, AccountBanner } from "./AccountBanner";

const mapStateToProps = (
  state,
  {
    match: {
      params: { id, parentId },
    },
  },
) => {
  const parentAccount: ?Account = parentId && accountSelector(state, { accountId: parentId });
  let account: ?AccountLike;
  if (parentAccount) {
    account = findSubAccountById(parentAccount, id);
  } else {
    account = accountSelector(state, { accountId: id });
  }
  return {
    parentAccount,
    account,
    countervalueFirst: countervalueFirstSelector(state),
  };
};

const mapDispatchToProps = {
  setCountervalueFirst,
};

type Props = {
  t: TFunction,
  account?: AccountLike,
  parentAccount?: Account,
  countervalueFirst: boolean,
  setCountervalueFirst: boolean => void,
};

const AccountPage = ({
  account,
  parentAccount,
  t,
  countervalueFirst,
  setCountervalueFirst,
}: Props) => {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const AccountBodyHeader = mainAccount
    ? perFamilyAccountBodyHeader[mainAccount.currency.family]
    : null;
  const AccountSubHeader = mainAccount
    ? perFamilyAccountSubHeader[mainAccount.currency.family]
    : null;
  const bgColor = useTheme("colors.palette.background.paper");

  const isCompoundEnabled = useCompoundAccountEnabled(account, parentAccount);

  const [banner, setBanner] = useState({});

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      const bannerProps = getBannerProps(account, { t, dispatch });
      setBanner(bannerProps);
    };
    fetchData();
  }, [account, t, dispatch]);

  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const filterOperations = useCallback(
    (operation, account) => {
      return !operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
    },
    [hiddenNftCollections],
  );

  if (!account || !mainAccount) {
    return <Redirect to="/accounts" />;
  }

  const ctoken = account.type === "TokenAccount" ? findCompoundToken(account.token) : null;

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency, bgColor);

  return (
    <Box key={account.id}>
      <TrackPage
        category="Account"
        currency={currency.id}
        operationsLength={account.operations.length}
      />
      <SyncOneAccountOnMount reason="view-account" priority={10} accountId={mainAccount.id} />
      <Box
        horizontal
        mb={1}
        flow={4}
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <AccountHeader account={account} parentAccount={parentAccount} />
        <AccountHeaderSettingsButton account={account} parentAccount={parentAccount} />
      </Box>
      <Box
        horizontal
        pb={3}
        flow={4}
        style={{
          width: "100%",
          overflowX: "visible",
          marginBottom: "30px",
        }}
      >
        <AccountHeaderActions account={account} parentAccount={parentAccount} />
      </Box>
      {AccountSubHeader ? (
        <AccountSubHeader account={account} parentAccount={parentAccount} />
      ) : null}
      {!isAccountEmpty(account) ? (
        <>
          <Box mb={7}>
            <BalanceSummary
              mainAccount={mainAccount}
              account={account}
              parentAccount={parentAccount}
              chartColor={color}
              countervalueFirst={countervalueFirst}
              setCountervalueFirst={setCountervalueFirst}
              isCompoundEnabled={isCompoundEnabled}
              ctoken={ctoken}
            />
          </Box>
          {banner.display && <AccountBanner {...banner} />}
          {AccountBodyHeader ? (
            <AccountBodyHeader account={account} parentAccount={parentAccount} />
          ) : null}
          {isCompoundEnabled && account.type === "TokenAccount" && parentAccount ? (
            <CompoundBodyHeader account={account} parentAccount={parentAccount} />
          ) : null}
          {account.type === "Account" && isNFTActive(account.currency) ? (
            <Collections account={account} />
          ) : null}
          {account.type === "Account" ? <TokensList account={account} /> : null}
          <OperationsList
            account={account}
            parentAccount={parentAccount}
            title={t("account.lastOperations")}
            filterOperation={filterOperations}
          />
        </>
      ) : (
        <EmptyStateAccount account={account} parentAccount={parentAccount} />
      )}
    </Box>
  );
};

const ConnectedAccountPage: React$ComponentType<{}> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(AccountPage);

export default ConnectedAccountPage;
