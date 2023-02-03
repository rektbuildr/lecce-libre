import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DiscoverPage } from "../../models/DiscoverPage";

test.use({ userdata: "1AccountBTC1AccountETH", env: { MOCK: undefined } });
// process.env.PWDEBUG = "1";

test("Navigate to Paraswap", async ({ page }) => {
  const swapPage = new SwapPage(page);
  const discoverPage = new DiscoverPage(page);

  await test.step("Navigate to Paraswap", async () => {
    await swapPage.navigate();
    await swapPage.sendMax();
    await swapPage.waitForExchangeToBeAvailable();
    await swapPage.reverseSwapPair();
    await swapPage.openAccountDropdownByAccountName("Ethereum 1");
    await swapPage.selectAccountByName("Ethereum 2");
    await swapPage.selectAccountByName("Bitcoin");
    await swapPage.selectAccountByName("USD Coin (USDC)");
    await swapPage.openTargetAccountDrawer();
    await swapPage.selectTargetAccount("USD Coin", 1);
    await swapPage.selectExchangeQuote("paraswap", "float");
    await swapPage.confirmExchange();
    expect(await discoverPage.getLiveAppTitle()).toBe("ParaSwap");
    expect(await page.locator("webview")).toBeVisible();
    await discoverPage.waitForLiveAppToLoad();
    await page.pause();
  });
});
