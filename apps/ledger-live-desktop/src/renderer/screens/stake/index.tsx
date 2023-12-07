import { useCallback } from "react";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "./constants";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getAccountName } from "@ledgerhq/live-common/account/index";

type Props = {
  currencies?: string[];
  shouldRedirect?: boolean;
  alwaysShowNoFunds?: boolean;
  source?: string;
  /** "get-funds" shows different text on no funds modal if entry point is "get coins" button. Default is undefined. */
  entryPoint?: "get-funds" | undefined;
};

const useStakeFlow = () => {
  const history = useHistory();
  const { params: { list } = { list: undefined } } = useFeature("stakePrograms") || {};
  const dispatch = useDispatch();

  return useCallback(
    ({
      currencies,
      shouldRedirect = true,
      alwaysShowNoFunds = false,
      source,
      entryPoint,
    }: Props = {}) => {
      const cryptoCurrencies = filterCurrencies(listCurrencies(true), {
        currencies: currencies || list,
      });

      setDrawer(
        SelectAccountAndCurrencyDrawer,
        {
          currencies: cryptoCurrencies,
          onAccountSelected: (account: AccountLike, parentAccount: Account | null = null) => {

            setDrawer();

            if (alwaysShowNoFunds) {
              dispatch(
                openModal("MODAL_NO_FUNDS_STAKE", {
                  account,
                  parentAccount,
                  entryPoint,
                }),
              );
            } else {
              dispatch(openModal("MODAL_START_STAKE", { account, parentAccount, source }));
            }

            if (shouldRedirect) {
              history.push({
                pathname: `/account/${account.id}`,
              });
            }
          },
        },
        {
          onRequestClose: () => {
            setDrawer();
            track("button_clicked", {
              ...stakeDefaultTrack,
              button: "close",
              page: history.location.pathname,
            });
          },
        },
      );
    },
    [dispatch, history, list],
  );
};

export default useStakeFlow;
