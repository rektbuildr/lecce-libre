import { loadConfig } from "../bridge/server";

describe("Navigate to the market page", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
  });

  it("should be able to navigate to the market page", () => {});
});
