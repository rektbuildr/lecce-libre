import { getElementById, getElementByText } from "../../helpers";

export default class MainMarketPage {
  marketHeader = () => getElementByText("Market");
  marketCryptocurrencyItem = (name: string) =>
    getElementById(`market-row-item-${name}`);
}
