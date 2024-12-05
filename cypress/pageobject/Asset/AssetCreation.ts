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

  selectAssetClass(assetClass: string) {
    cy.get("[data-testid=asset-class-input] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetClass).click();
      });
  }

  enterAssetDetails({
    name,
    description,
    workingStatus,
    qrId,
    manufacturer,
    warranty,
    supportName,
    supportPhone,
    supportEmail,
    vendorName,
    serialNumber,
    lastServicedOn,
    notes,
  }: {
    name?: string;
    description?: string;
    workingStatus?: string;
    qrId?: string;
    manufacturer?: string;
    warranty?: string;
    supportName?: string;
    supportPhone?: string;
    supportEmail?: string;
    vendorName?: string;
    serialNumber?: string;
    lastServicedOn?: string;
    notes?: string;
  }) {
    if (name) cy.get("[data-testid=asset-name-input] input").type(name);
    if (description)
      cy.get("[data-testid=asset-description-input] textarea").type(
        description,
      );
    if (workingStatus)
      cy.get("[data-testid=asset-working-status-input] li")
        .contains(workingStatus)
        .click();
    if (qrId) cy.get("[data-testid=asset-qr-id-input] input").type(qrId);
    if (manufacturer)
      cy.get("[data-testid=asset-manufacturer-input] input").type(manufacturer);
    if (warranty)
      cy.get("[data-testid=asset-warranty-input] input").type(warranty);
    if (supportName)
      cy.get("[data-testid=asset-support-name-input] input").type(supportName);
    if (supportPhone) cy.get("#customer-support-phone-div").type(supportPhone);
    if (supportEmail)
      cy.get("[data-testid=asset-support-email-input] input").type(
        supportEmail,
      );
    if (vendorName)
      cy.get("[data-testid=asset-vendor-name-input] input").type(vendorName);
    if (serialNumber)
      cy.get("[data-testid=asset-serial-number-input] input").type(
        serialNumber,
      );
    if (lastServicedOn)
      cy.clickAndTypeDate(
        "[data-testid=asset-last-serviced-on-input]",
        lastServicedOn,
      );
    if (notes) cy.get("[data-testid=asset-notes-input] textarea").type(notes);
  }

  interceptAssetCreation() {
    cy.intercept("POST", "**/api/v1/asset/").as("createAsset");
  }

  verifyAssetCreation() {
    cy.wait("@createAsset").its("response.statusCode").should("eq", 201);
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
    cy.intercept("GET", "**/api/v1/asset/**").as("getAsset");
    cy.get("[data-testid=created-asset-list]").first().click();
    cy.wait("@getAsset").its("response.statusCode").should("eq", 200);
  }

  editAssetDetails(
    name: string,
    description: string,
    qrId: string,
    manufacturer: string,
    supportName: string,
    vendorName: string,
    notes: string,
    lastServicedOn: string,
  ) {
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
    cy.clickAndTypeDate(
      "[data-testid=asset-last-serviced-on-input]",
      lastServicedOn,
    );
    cy.get("[data-testid=asset-notes-input] textarea").clear().type(notes);
  }

  configureAsset(
    hostName: string,
    localIp: string,
    userName: string,
    password: string,
    streamUuid: string,
  ) {
    cy.get("[data-testid=asset-configure-button]").click();
    cy.get("[name=middleware_hostname]").type(hostName);
    cy.get("[name=camera_address]").type(localIp);
    cy.get("[name=username]").type(userName);
    cy.get("[name=password]").type(password);
    cy.get("[name=stream_uuid]").type(streamUuid);
  }

  configureVitalAsset(hostName: string, localIp: string) {
    cy.get("[data-testid=asset-configure-button]").click();
    cy.get("#middleware_hostname").type(hostName);
    cy.get("#localipAddress").type(localIp);
  }

  spyAssetConfigureApi() {
    cy.intercept(/\/api\/v1\/asset/).as("asset");
  }

  verifyAssetConfiguration() {
    cy.wait("@asset").its("response.statusCode").should("eq", 200);
  }

  clickConfigureAsset() {
    cy.get("#submit").contains("Update").click();
  }

  clickConfigureVital() {
    cy.intercept("PATCH", "**/api/v1/asset/**").as("postConfiguration");
    cy.get("#submit").contains("Save Configuration").click();
    cy.wait("@postConfiguration").its("response.statusCode").should("eq", 200);
  }

  clickUpdateAsset() {
    cy.get("#submit").contains("Update").click();
  }

  interceptDeleteAssetApi() {
    cy.intercept("DELETE", "**/api/v1/asset/**").as("deleteAsset");
  }

  deleteAsset() {
    cy.get("[data-testid=asset-delete-button]").click();
    cy.get("#submit").contains("Confirm").click();
  }

  verifyDeleteStatus() {
    cy.wait("@deleteAsset").its("response.statusCode").should("eq", 204);
  }

  verifyEmptyAssetNameError() {
    cy.get("[data-testid=asset-name-input] span").should(
      "contain",
      "Asset name can't be empty",
    );
  }

  verifyEmptyLocationError() {
    cy.get("[data-testid=asset-location-input] span").should(
      "contain",
      "Select a location",
    );
  }

  verifyEmptyStatusError() {
    cy.get("[data-testid=asset-working-status-input] span").should(
      "contain",
      "This field is required",
    );
  }

  verifyEmptyPhoneError() {
    cy.get("#customer-support-phone-div span").should(
      "contain",
      "Please enter valid phone number",
    );
  }

  clickupdatedetailbutton() {
    cy.get("[data-testid=asset-update-button]").click();
  }

  scrollintonotes() {
    cy.get("#notes").scrollIntoView();
  }

  enterAssetNotes(text: string) {
    cy.get("#notes").click().clear();
    cy.get("#notes").click().type(text);
  }

  enterAssetservicedate(text: string) {
    cy.clickAndTypeDate("input[name='last_serviced_on']", text);
  }

  scrollintoWarrantyDetails() {
    cy.get("#warranty-details").scrollIntoView();
  }

  enterWarrantyExpiryDate(text: string) {
    cy.get("#WarrantyAMCExpiry").click();
    cy.get("#WarrantyAMCExpiry").click().type(text);
  }

  verifyWarrantyExpiryLabel(duration: string) {
    if (duration === "") {
      cy.get("#warranty-amc-expired-red").should("not.exist");
      cy.get("#warranty-amc-expiring-soon-orange").should("not.exist");
      cy.get("#warranty-amc-expiring-soon-yellow").should("not.exist");
    } else if (duration === "expired") {
      cy.get("#warranty-amc-expired-red").should("be.visible");
    } else if (duration === "1 month") {
      cy.get("#warranty-amc-expiring-soon-orange").should("be.visible");
    } else if (duration === "3 months") {
      cy.get("#warranty-amc-expiring-soon-yellow").should("be.visible");
    }
  }

  clickassetupdatebutton() {
    cy.get("#submit").click();
  }

  viewassetservicehistorybutton() {
    cy.get("#view-service-history").should("be.visible");
  }

  openassetservicehistory() {
    cy.get("#view-service-history").click();
    cy.get("#view-asset-edit-history").first().click();
  }

  verifyassetupdateservicehistory() {
    cy.get("#edit-history-asset-servicedon").should("have.text", "01/09/2023");
    cy.get("#edit-history-asset-note").should(
      "have.text",
      "Dummy Notes Editted",
    );
    cy.get("#view-history-back-button").contains("Back").click();
    cy.get("#view-history-back-button").contains("Close").click();
  }

  scrollintoservicehistory() {
    cy.get("#service-history").scrollIntoView();
  }

  clickedithistorybutton() {
    cy.get("#edit-service-history").click();
  }

  verifytransactionStatus(initiallocationName: string, locationName: string) {
    cy.get("#transaction-history").scrollIntoView();
    cy.get("#transaction-history table tbody tr:first-child td:eq(0)").should(
      "contain",
      initiallocationName,
    );
    cy.get("#transaction-history table tbody tr:first-child td:eq(1)").should(
      "contain",
      locationName,
    );
  }

  verifyassetlocation(locationName: string) {
    cy.get("#asset-current-location").should("contain", locationName);
  }

  clickassetlocation(locationName: string) {
    cy.get("#clear-button").click();
    cy.get("[data-testid=asset-location-input] button").click();
    cy.get("[data-testid=asset-location-input] button")
      .click()
      .type(locationName);
    cy.get("[role='option']").contains(locationName).click();
  }
}
