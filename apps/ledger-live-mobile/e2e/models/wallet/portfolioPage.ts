import { getElementById, tapByElement } from "../../helpers";

export default class PortfolioPage {
  getEmptyPortfolio = () => getElementById("PortfolioEmptyAccount");
  getSettingsButton = () => {
    // FIXME: weird that we check for settings-icon to be sure we are on portfolio page ?
    return getElementById("settings-icon");
  };
  marketPageButton = () => getElementById("market-navigator-button");

  async navigateToSettings() {
    // FIXME: this is probably better in settings page model ?
    await tapByElement(this.getSettingsButton());
  }

  async navigateToMarket() {
    await tapByElement(this.marketPageButton());
  }
}
