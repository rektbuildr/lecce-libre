import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import { closeAllModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";



const BuyButton = ({ currency, account }: { currency: CryptoCurrency; account: Account }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(closeAllModal());
    
    history.push({
      pathname: "/exchange",
      state: {
        currency: currency.id,
        account: account.id,
        mode: "buy", // buy or sell
      },
    });
  }, [account, currency, dispatch, history]);

  if (!isCurrencySupported("BUY", currency)) {
    return null;
  }

  return (
    <Button mr={1} primary onClick={onClick}>
      <Trans
        i18nKey="buy.buyCTA"
        values={{
          currencyTicker: currency.ticker,
        }}
      />
    </Button>
  );
};
export default BuyButton;
