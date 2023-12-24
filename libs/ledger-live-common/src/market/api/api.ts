import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { listCryptoCurrencies, listSupportedCurrencies, listTokens } from "../../currencies";
import { getEnv } from "@ledgerhq/live-env";
import {
  CurrencyData,
  MarketCoin,
  MarketCurrencyChartDataRequestParams,
  MarketListRequestParams,
  SparklineSvgData,
  SupportedCoins,
} from "../types";
import { rangeDataTable } from "../utils/rangeDataTable";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

const supportedCurrencies = listSupportedCurrencies();

const liveCompatibleIds: string[] = supportedCurrencies
  .map(({ id }: CryptoCurrency) => id)
  .filter(Boolean);

let LIVE_COINS_LIST: string[] = [];

const ROOT_PATH = getEnv("MARKET_API_URL");

let SUPPORTED_COINS_LIST: SupportedCoins = [];

async function setSupportedCoinsList(): Promise<SupportedCoins> {
  return [];
}

const matchSearch =
  (search: string) =>
  (currency: MarketCoin): boolean => {
    if (!search) return false;
    const match = `${currency.symbol}|${currency.name}`;
    return match.toLowerCase().includes(search.toLowerCase());
  };

function distributedCopy(items: number[], n: number): number[] {
  if (!items) return [];
  if (items.length <= n) return items;
  const elements = [items[0]];
  const totalItems = items.length - 2;
  const interval = Math.floor(totalItems / (n - 2));
  for (let i = 1; i < n - 1; i++) {
    elements.push(items[i * interval]);
  }
  elements.push(items[items.length - 1]);
  return elements;
}

const sparklineXMagnitude = 5;
const sparklineYHeight = 50;

function sparklineAsSvgData(points: number[]): SparklineSvgData {
  const totalXSteps = sparklineXMagnitude * points.length;
  const min = Math.min(...points);
  const max = Math.max(...points);

  const yOffset = max - min;

  return {
    path: points
      .map((d, i) => {
        const [x, y] = [
          i * sparklineXMagnitude,
          sparklineYHeight + 3 - ((d - min) * sparklineYHeight) / yOffset,
        ];
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" "),
    viewBox: `0 0 ${totalXSteps} ${sparklineYHeight + 3}`,
    isPositive: points[0] <= points[points.length - 1],
  };
}

// fetches currencies data for selected currencies ids
async function listPaginated({
  counterCurrency,
  range = "24h",
  limit = 50,
  page = 1,
  ids: _ids = [],
  starred = [],
  orderBy = "market_cap",
  order = "desc",
  search = "",
  sparkline = true,
  liveCompatible = false,
  top100 = false,
}: MarketListRequestParams): Promise<CurrencyData[]> {
  return [];
}

// Fetches list of supported counterCurrencies
async function supportedCounterCurrencies(): Promise<string[]> {
  return [];
}

// Fetches list of supported currencies
async function currencyChartData({
  id,
  counterCurrency,
  range = "24h",
}: MarketCurrencyChartDataRequestParams): Promise<{
  [range: string]: number[];
}> {
  const { days, interval } = rangeDataTable[range];
  const url = `${ROOT_PATH}/coins/${id}/market_chart?vs_currency=${counterCurrency}&days=${days}&interval=${interval}`;

  const { data } = await network({
    method: "GET",
    url,
  });

  return { [range]: data.prices };
}

export default {
  setSupportedCoinsList,
  listPaginated,
  supportedCounterCurrencies,
  currencyChartData,
};
