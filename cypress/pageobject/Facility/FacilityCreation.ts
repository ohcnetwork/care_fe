import { advanceFilters } from "pageobject/utils/advanceFilterHelpers";

export interface FacilityData {
  basic: {
    name: string;
    type: string;
    features?: string[];
    address: string;
    phoneNumber: string;
    location?: string;
  };
  location: {
    pincode: string;
    state: string;
    district: string;
    localBody: string;
    ward: string;
  };
}

class FacilityPage {
  visitCreateFacilityPage() {
    cy.intercept("GET", "**/facility/create").as("getCreateFacilities");
    cy.visit("/facility/create");
    cy.wait("@getCreateFacilities")
      .its("response.statusCode")
      .should("eq", 200);
  }

  selectFacilityType(facility: string) {
    advanceFilters.selectFacilityType(facility);
  }

  selectLocalBody(localBody: string) {
    advanceFilters.selectLocalBody(localBody);
  }

  typeFacilityName(name: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#name", name, { clearBeforeTyping });
  }

  fillPincode(pincode: string) {
    cy.get("#pincode").click().type(pincode);
  }

  selectWard(ward: string) {
    cy.get("div#ward button").click();
    cy.get("[role='option']").contains(ward).click();
  }

  typeFacilityAddress(address: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField("#address", address, { clearBeforeTyping });
  }

  typeFacilityPhoneNumber(
    phoneNumber: string,
    clearBeforeTyping: boolean = false,
  ) {
    cy.typeIntoField("#phone_number", phoneNumber, { clearBeforeTyping });
  }

  clickSaveFacilityButton() {
    cy.verifyAndClickElement("#submit", "Save Facility");
  }

  verifyFacilityCreatedNotification() {
    cy.verifyNotification("Facility added successfully");
    cy.closeNotification();
  }

  verifyFacilityUpdatedNotification() {
    cy.verifyNotification("Facility updated successfully");
    cy.closeNotification();
  }

  clickManageFacilityDropdown() {
    cy.get("h1.text-3xl.font-bold", { timeout: 20000 }).should("be.visible");
    cy.get("#manage-facility-dropdown button").scrollIntoView();
    cy.get("#manage-facility-dropdown button")
      .contains("Manage Facility")
      .click();
  }

  clickUpdateFacilityOption() {
    cy.get("#update-facility").contains("Update Facility").click();
  }

  clickUpdateFacilityButton() {
    cy.verifyAndClickElement("#submit", "Update Facility");
  }

  clickConfigureFacilityOption() {
    cy.get("#configure-facility").contains("Configure Facility").click();
  }

  clickCreateAssetFacilityOption() {
    cy.get("#create-assets").contains("Create Asset").click();
  }

  clickviewAssetFacilityOption() {
    cy.get("#view-assets").contains("View Assets").click();
  }

  clickViewUsersOption() {
    cy.get("#view-users").click();
  }

  clickInventoryManagementOption() {
    cy.get("#inventory-management", { timeout: 10000 }).should("be.visible");
    cy.get("#inventory-management").click();
  }

  getFacilityName() {
    return cy.get("#facility-name");
  }

  getAddressDetailsView() {
    return cy.get("#address-details-view");
  }

  getPhoneNumberView() {
    return cy.get("#phone-number-view");
  }

  getFacilityAvailableFeatures() {
    return cy.get("#facility-available-features");
  }

  clickResourceRequestOption() {
    cy.get("#resource-request").contains("Resource Request").click();
  }

  clickDeleteFacilityOption() {
    cy.get("#delete-facility").contains("Delete Facility").click();
  }

  clickfacilityfeatureoption() {
    cy.get("#features").click();
  }

  clickcancelbutton() {
    cy.get("#cancel").click();
  }

  verifyfacilitynewurl() {
    cy.url().should("match", /facility\/[a-z\d-]+/);
  }

  verifyresourcenewurl() {
    cy.url().should("match", /resource\/[a-z\d-]+/);
  }

  confirmDeleteFacility() {
    cy.clickSubmitButton("Delete");
  }

  selectLocation(location: string) {
    cy.intercept("https://maps.googleapis.com/**").as("mapApi");
    cy.get("#facility-location-button").click();
    cy.wait("@mapApi").its("response.statusCode").should("eq", 200);
    cy.get("input#pac-input").type(location).type("{enter}");
    cy.wait(2000);
    cy.get("div#map-close").click();
  }

  fillMiddleWareAddress(url: string) {
    cy.get("#middleware_address").type(url);
  }

  clickupdateMiddleWare() {
    cy.intercept("PATCH", "**/api/v1/facility/**").as("updateMiddleWare");
    cy.get("button#submit").first().click();
    cy.wait("@updateMiddleWare").its("response.statusCode").should("eq", 200);
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  verifyErrorNotification(message: string) {
    cy.verifyNotification(message);
  }

  visitAlreadyCreatedFacility() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("h1.text-3xl.font-bold", { timeout: 10000 }).should("be.visible");
  }

  verifyfacilitycreateassetredirection() {
    cy.url().should("include", "/assets/new");
  }

  verifyassetfacilitybackredirection() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getManagePage");
    cy.go("back");
    cy.wait("@getManagePage").its("response.statusCode").should("eq", 200);
  }

  verifyfacilityviewassetredirection() {
    cy.url().should("include", "/assets?facility=");
  }

  clickManageInventory() {
    cy.contains("Manage Inventory").click();
  }

  fillInventoryDetails(name: string, status: string, quantity: string) {
    cy.wait(2000);
    cy.get("div#id").click();
    cy.get("div#id ul li").contains(name).click();
    cy.get("div#isIncoming").click();
    cy.get("div#isIncoming ul li").contains(status).click();
    cy.get("[name='quantity']").type(quantity);
  }

  fillInventoryMinimumDetails(name: string, quantity: string) {
    cy.wait(2000);
    cy.get("div#id").click();
    cy.get("div#id ul li").contains(name).click();
    cy.get("[name='quantity']").type(quantity);
  }

  clickAddInventory() {
    cy.intercept("POST", "**/api/v1/facility/*/inventory/").as(
      "createInventory",
    );
    cy.get("button").contains("Add/Update Inventory").click();
    cy.wait("@createInventory").its("response.statusCode").should("eq", 201);
  }

  clickSetButton() {
    cy.get("#submit").contains("Set").click();
  }

  fillResourceRequestDetails(
    name: string,
    phone_number: string,
    facility: string,
    title: string,
    quantity: string,
    description: string,
  ) {
    cy.get("#refering_facility_contact_name").type(name);
    cy.get("#refering_facility_contact_number").type(phone_number);
    cy.get("[name='approving_facility']")
      .type(facility)
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("#title").type(title);
    cy.get("#requested_quantity").type(quantity);
    cy.get("#reason").type(description);
  }

  clickSubmitRequestButton() {
    cy.intercept("POST", "**/api/v1/resource/").as("createResourceRequest");
    cy.get("button").contains("Submit").click();
    cy.wait("@createResourceRequest")
      .its("response.statusCode")
      .should("eq", 201);
  }

  getStateElement() {
    return cy.get("#state");
  }

  getDistrictElement() {
    return cy.get("#district");
  }

  selectStateOnPincode(stateName: string) {
    this.getStateElement()
      .scrollIntoView()
      .wait(2000)
      .should("be.visible")
      .then(($element) => {
        const text = $element.text();
        if (!text.includes(stateName)) {
          this.getStateElement().click();
          cy.get("li[role=option]").contains(stateName).click();
        }
      });
  }

  selectDistrictOnPincode(districtName: string) {
    this.getDistrictElement().as("district").scrollIntoView().wait(2000);
    cy.get("@district")
      .should("be.visible")
      .then(($element) => {
        const text = $element.text();
        if (!text.includes(districtName)) {
          this.getDistrictElement().click();
          cy.get("li[role=option]").contains(districtName).click();
        }
      });
  }

  verifyPpeQuantity(text: string) {
    cy.get("#PPE").contains(text).should("be.visible");
  }

  clickPpeQuantity() {
    cy.get("#PPE").click();
  }

  clickLastEntry() {
    cy.get("#delete-last-entry").click();
  }

  verifyStockInRow(rowId: string, stockText: string) {
    cy.get(rowId).contains(stockText).should("be.visible");
  }

  verifyBadgeWithText(badgeClass: string, text: string) {
    cy.get(badgeClass).contains(text).should("exist");
  }

  clickAddMinimumQuanitity() {
    cy.get("#add-minimum-quantity").click();
  }

  clickUpdateMinimumQuantity() {
    cy.get("#update-minimum-quantity").first().click();
  }

  setQuantity(quantity: string) {
    cy.get("#quantity").click().clear().click().type(quantity);
  }

  clickSaveUpdateMinimumQuantity() {
    cy.get("#save-update-minimumquanitity").click();
  }

  clickSetMinimumQuantity() {
    cy.get("#set-minimum-quantity").click();
  }

  createNewFacility(data: FacilityData) {
    this.visitCreateFacilityPage();

    // Fill basic details
    this.fillBasicDetails(data.basic);

    // Fill location details
    this.fillLocationDetails(data.location);

    this.clickSaveFacilityButton();
    cy.closeNotification();

    this.verifyfacilitynewurl();
    return this;
  }

  fillBasicDetails(basic: FacilityData["basic"]) {
    this.typeFacilityName(basic.name);
    this.selectFacilityType(basic.type);

    if (basic.features?.length) {
      this.clickfacilityfeatureoption();
      basic.features.forEach((feature) => {
        cy.get("[role='option']").contains(feature).click();
      });
      this.clickfacilityfeatureoption();
    }

    this.typeFacilityAddress(basic.address);
    this.typeFacilityPhoneNumber(basic.phoneNumber);

    if (basic.location) {
      this.selectLocation(basic.location);
    }
  }

  fillLocationDetails(location: FacilityData["location"]) {
    this.fillPincode(location.pincode);
    this.selectStateOnPincode(location.state);
    this.selectDistrictOnPincode(location.district);
    this.selectLocalBody(location.localBody);
    this.selectWard(location.ward);
  }
}

export default FacilityPage;
