// assetPage.ts

export class AssetPage {
  createAsset() {
    cy.get("button").should("contain", "Create Asset");
    cy.get("[data-testid=create-asset-buttom] button").click();
  }

  selectFacility(facilityName: string) {
    cy.get("input[name='facilities']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
      });
    cy.get("[data-testid='submit-button']").click();
  }

  selectLocation(locationName: string) {
    cy.get("[data-testid=asset-location-input] input")
      .type(locationName)
      .then(() => {
        cy.get("[role='option']").contains(locationName).click();
      });
  }

  selectAssetType(assetType: string) {
    cy.get("[data-testid=asset-type-input] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetType).click();
      });
  }

  selectAssetClass(assetClass: string) {
    cy.get("[data-testid=asset-class-input] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetClass).click();
      });
  }

  enterAssetDetails(
    name: string,
    description: string,
    workingStatus: string,
    qrId: string,
    manufacturer: string,
    warranty: string,
    supportName: string,
    supportPhone: string,
    supportEmail: string,
    vendorName: string,
    serialNumber: string,
    lastServicedOn: string,
    notes: string
  ) {
    cy.get("[data-testid=asset-name-input] input").type(name);
    cy.get("[data-testid=asset-description-input] textarea").type(description);
    cy.get("[data-testid=asset-working-status-input] li")
      .contains(workingStatus)
      .click();
    cy.get("[data-testid=asset-qr-id-input] input").type(qrId);
    cy.get("[data-testid=asset-manufacturer-input] input").type(manufacturer);
    cy.get("[data-testid=asset-warranty-input] input").type(warranty);
    cy.get("[data-testid=asset-support-name-input] input").type(supportName);
    cy.get("#customer-support-phone-div").type(supportPhone);
    cy.get("[data-testid=asset-support-email-input] input").type(supportEmail);
    cy.get("[data-testid=asset-vendor-name-input] input").type(vendorName);
    cy.get("[data-testid=asset-serial-number-input] input").type(serialNumber);
    cy.get("[data-testid=asset-last-serviced-on-input] input").type(
      lastServicedOn
    );
    cy.get("[data-testid=asset-notes-input] textarea").type(notes);
  }

  clickCreateAsset() {
    cy.get("#submit").contains("Create Asset").click();
  }

  clickCreateAddMore() {
    cy.get("[data-testid=create-asset-add-more-button]").click();
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  openCreatedAsset() {
    cy.get("[data-testid=created-asset-list]").first().click();
  }

  editAssetDetails(
    name: string,
    description: string,
    qrId: string,
    manufacturer: string,
    supportName: string,
    vendorName: string,
    notes: string
  ) {
    cy.wait(3000);
    cy.get("[data-testid=asset-update-button]").click();
    cy.get("[data-testid=asset-name-input] input").clear().type(name);
    cy.get("[data-testid=asset-description-input] textarea")
      .clear()
      .type(description);
    cy.get("[data-testid=asset-qr-id-input] input").clear().type(qrId);
    cy.get("[data-testid=asset-manufacturer-input] input")
      .clear()
      .type(manufacturer);
    cy.get("[data-testid=asset-support-name-input] input")
      .clear()
      .type(supportName);
    cy.get("[data-testid=asset-vendor-name-input] input")
      .clear()
      .type(vendorName);
    cy.get("[data-testid=asset-notes-input] textarea").clear().type(notes);
  }

  configureAsset(
    hostName: string,
    localIp: string,
    userName: string,
    password: string,
    streamUuid: string
  ) {
    cy.get("[data-testid=asset-configure-button]").click();
    cy.get("[name=middleware_hostname]").type(hostName);
    cy.get("[name=camera_address]").type(localIp);
    cy.get("[name=username]").type(userName);
    cy.get("[name=password]").type(password);
    cy.get("[name=stream_uuid]").type(streamUuid);
  }

  spyAssetConfigureApi() {
    cy.intercept(/\/api\/v1\/asset/).as("asset");
  }

  verifyAssetConfiguration() {
    cy.wait("@asset").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
  }

  clickConfigureAsset() {
    cy.get("#submit").contains("Set Configuration").click();
  }

  clickUpdateAsset() {
    cy.get("#submit").contains("Update").click();
  }

  deleteAsset() {
    cy.get("[data-testid=asset-delete-button]").click();
    cy.get("#submit").contains("Confirm").click();
  }

  verifyEmptyAssetNameError() {
    cy.get("[data-testid=asset-name-input] span").should(
      "contain",
      "Asset name can't be empty"
    );
  }

  verifyEmptyLocationError() {
    cy.get("[data-testid=asset-location-input] span").should(
      "contain",
      "Select a location"
    );
  }

  verifyEmptyAssetTypeError() {
    cy.get("[data-testid=asset-type-input] span").should(
      "contain",
      "Select an asset type"
    );
  }

  verifyEmptyStatusError() {
    cy.get("[data-testid=asset-working-status-input] span").should(
      "contain",
      "Field is required"
    );
  }

  verifyEmptyPhoneError() {
    cy.get("#customer-support-phone-div span").should(
      "contain",
      "Please enter valid phone number"
    );
  }

  selectImportFacility(facilityName: string) {
    cy.get("input[name='facilities']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
      });
  }

  selectImportOption() {
    cy.get("[data-testid=import-asset-button]").click();
    cy.get(".import-assets-button").click();
  }

  importAssetFile() {
    cy.get("[data-testid=import-asset-file]")
      .selectFile("cypress/fixtures/sampleAsset.xlsx", { force: true })
      .wait(100);
  }

  selectImportLocation(locationName: string) {
    cy.get("[data-testid=select-import-location]").click();
    cy.get("li[role=option]").contains(locationName).click();
  }

  clickImportAsset() {
    cy.get("#submit").contains("Import").click();
  }
}
