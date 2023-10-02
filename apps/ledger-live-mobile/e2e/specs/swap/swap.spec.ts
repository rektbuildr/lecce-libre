import { expect, device } from "detox";
import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/devices";
import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import SwapFormPage from "../../models/trade/swapFormPage";
import DeviceAction from "../../models/DeviceAction";
import { delay, tapByText } from "../../helpers";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";

let portfolioPage: PortfolioPage;
let swapPage: SwapFormPage;
let deviceAction: DeviceAction;

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Swap", () => {
  beforeAll(async () => {
    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    swapPage = new SwapFormPage();
    deviceAction = new DeviceAction(knownDevice);

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await swapPage.openViaDeeplink();
    await expect(swapPage.swapFormTab()).toBeVisible();
  });

  it("should be able to select a different source account", async () => {
    await swapPage.openSourceAccountSelector();
    await swapPage.selectAccount("Bitcoin 1 (legacy)");
  });

  it("should show an error for too low an amount", async () => {
    await swapPage.enterSourceAmount("0.00001");
    // unfortunately there's no way to check if a button that is disabled in the JS is actually disabled on the native side (which is what Detox checks)
    // we tap the `Exchange` button to see if the next step fails as a way of checking if the exchange button disabled. If it proceeds then the button was incorrectly available and the next test will fail
    await swapPage.startExchange();
  });

  it("should show an error for not enough funds", async () => {
    await swapPage.enterSourceAmount("10");
    await swapPage.startExchange();
  });

  it("should be able to select a different destination account", async () => {
    await swapPage.openDestinationAccountSelector();
    await swapPage.selectAccount("Ethereum");
  });

  it("should be able to send the maximum available amount", async () => {
    await swapPage.sendMax();
    await swapPage.startExchange();
    await expect(swapPage.termsAcceptButton()).toBeVisible();
    await expect(swapPage.termsCloseButton()).toBeVisible();
  });

  it("should be able to send the maximum available amount", async () => {
    await tapByText("Accept");
    await deviceAction.selectMockDevice();
    await deviceAction.accessManagerWithL10n();
    await delay(5000);
    await deviceAction.initiateSwap(new BigNumber(1000));
    await delay(5000);

    const transaction = fromTransactionRaw({
      family: "bitcoin",
      recipient: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
      amount: "0.35",
      feePerByte: "1",
      networkInfo: {
        family: "bitcoin",
        feeItems: {
          items: [
            {
              key: "0",
              speed: "high",
              feePerByte: "3",
            },
            {
              key: "1",
              speed: "standard",
              feePerByte: "2",
            },
            {
              key: "2",
              speed: "low",
              feePerByte: "1",
            },
          ],
          defaultFeePerByte: "1",
        },
      },
      rbf: false,
      utxoStrategy: {
        strategy: 0,
        excludeUTXOs: [],
      },
    });

    await deviceAction.confirmSwap(transaction);
    await delay(5000);
    await deviceAction.openApp();
    await delay(5000);
    await deviceAction.complete();
    await delay(5000);
  });
});
