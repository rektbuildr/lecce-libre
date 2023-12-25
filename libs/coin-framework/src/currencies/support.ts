import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, CryptoCurrencyId, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";

// set by user side effect to precise which currencies are considered supported (typically by live)
let userSupportedCurrencies: CryptoCurrency[] = [];
let userSupportedFiats: FiatCurrency[] | null = null;

// The API returns Coingeko countervalues tickers, but getFiatCurrencyByTicker might not support each of those.
const locallySupportedFiats = [
  "AED",
  "AUD",
  "BGN",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CRC",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "GHS",
  "HKD",
  "HRK",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "IRR",
  "JPY",
  "KES",
  "KHR",
  "KRW",
  "MUR",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RON",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "VES",
  "VND",
  "VUV",
  "ZAR",
];

async function initializeUserSupportedFiats() {
  try {
    const ids = await fetchSupportedFiatsTokens();
    const idsToUpper = ids.map(id => id.toUpperCase());

    // This makes sure we only keep the elements supported in our API and that are available for getFiatCurrencyByTicker
    const supportedTokens = idsToUpper.filter(token => locallySupportedFiats.includes(token));
    userSupportedFiats = supportedTokens.map(id => {
      return getFiatCurrencyByTicker(id);
    });
  } catch (error) {
    throw new Error(`Failed to get supported Fiats. Error Message: ${error}`);
  }
}

export async function fetchSupportedFiatsTokens(): Promise<string[]> {
  try {
    return [
      "aed",
      "ars",
      "aud",
      "bdt",
      "bhd",
      "bmd",
      "brl",
      "cad",
      "chf",
      "clp",
      "cny",
      "czk",
      "dkk",
      "eur",
      "gbp",
      "gel",
      "hkd",
      "huf",
      "idr",
      "ils",
      "inr",
      "jpy",
      "krw",
      "kwd",
      "lkr",
      "mmk",
      "mxn",
      "myr",
      "ngn",
      "nok",
      "nzd",
      "php",
      "pkr",
      "pln",
      "rub",
      "sar",
      "sek",
      "sgd",
      "thb",
      "try",
      "twd",
      "uah",
      "usd",
      "vnd",
      "xag",
      "xau",
      "xdr",
      "zar"
  ];
  } catch (error) {
    // Handle any network or parsing errors here
    console.error("Error:", error);
    throw error;
  }
}

// Usage of isFiatSupported and listSupportedFiats should check if userSupportedFiats is populated
export function isFiatSupported(fiat: FiatCurrency) {
  return userSupportedFiats?.includes(fiat);
}

export async function listSupportedFiats(): Promise<FiatCurrency[]> {
  if (userSupportedFiats === null) {
    // Handle case where userSupportedFiats is not yet populated (e.g., by calling initializeUserSupportedFiats)
    try {
      await initializeUserSupportedFiats();
    } catch (error) {
      // Handle initialization error
      log("debug", `Failed to initialize userSupportedFiats. Error Message: ${error}`);
      return [];
    }
    return userSupportedFiats || [];
  }
  return userSupportedFiats;
}

export function setSupportedCurrencies(ids: CryptoCurrencyId[]) {
  userSupportedCurrencies = Array.from(new Set(ids)) // Make sure to remove duplicates
    .map(id => getCryptoCurrencyById(id));
}

function getExperimentalSupports() {
  return getEnv("EXPERIMENTAL_CURRENCIES")
    .split(",")
    .filter(
      (id: string) => hasCryptoCurrencyId(id) && !userSupportedCurrencies.find(c => c.id === id),
    )
    .map(getCryptoCurrencyById);
}

export function listSupportedCurrencies(): CryptoCurrency[] {
  const experimentals = getExperimentalSupports();
  return experimentals.length === 0
    ? userSupportedCurrencies
    : userSupportedCurrencies.concat(experimentals);
}

export function isCurrencySupported(currency: CryptoCurrency): boolean {
  return listSupportedCurrencies().includes(currency);
}
