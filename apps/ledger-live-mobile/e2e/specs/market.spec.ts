import { expect } from "detox";
import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import MainMarketPage from "../models/market/mainMarketPage";

describe("Navigate to the market page", () => {
  let portfolioPage: PortfolioPage;
  let mainMarketPage: MainMarketPage;

  beforeAll(async () => {
    portfolioPage = new PortfolioPage();
    mainMarketPage = new MainMarketPage();

    await loadConfig("1AccountBTC1AccountETH", true);
  });

  it("should be able to navigate to the market page", async () => {
    await portfolioPage.navigateToMarket();
    await expect(mainMarketPage.marketHeader()).toBeVisible();
    await expect(
      mainMarketPage.marketCryptocurrencyItem("bitcoin"),
    ).toBeVisible();
  });
});
