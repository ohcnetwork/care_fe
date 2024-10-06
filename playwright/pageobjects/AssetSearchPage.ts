import { Page, Locator } from "@playwright/test";

export class AssetSearchPage {
  private page: Page;
  private searchInput: Locator;
  private badge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator("#search");
    this.badge = page.locator('[data-testid="Name/Serial No./QR ID"]');
  }

  async typeSearchKeyword(keyword: string) {
    await this.searchInput.click();
    await this.searchInput.fill(keyword);
  }

  async pressEnter() {
    await this.page.keyboard.press("Enter");
  }

  async clickAssetByName(assetName: string) {
    await this.page
      .locator(`[data-testid='created-asset-list'] >> text=${assetName}`)
      .click();
  }

  async clickUpdateButton() {
    await this.page.locator('[data-testid="asset-update-button"]').click();
  }

  async clearAndTypeQRCode(qrCode: string) {
    const qrCodeInput = this.page.locator("#qr_code_id");
    await qrCodeInput.fill(qrCode);
  }

  async clearAndTypeSerialNumber(serialNumber: string) {
    const serialNumberInput = this.page.locator("#serial-number");
    await serialNumberInput.fill(serialNumber);
  }

  async clickAssetSubmitButton() {
    await this.page.locator("#submit").click();
  }

  async visitAssetsPage() {
    await this.page.goto("/assets");
  }
}
