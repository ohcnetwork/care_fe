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
  oxygen?: {
    capacity: string;
    expected: string;
    bType?: {
      capacity: string;
      expected: string;
    };
    cType?: {
      capacity: string;
      expected: string;
    };
    dType?: {
      capacity: string;
      expected: string;
    };
  };
  beds?: Array<{
    type: string;
    totalCapacity: string;
    occupied: string;
  }>;
  doctors?: Array<{
    specialization: string;
    count: string;
  }>;
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

  visitUpdateFacilityPage(url: string) {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.visit(url);
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("#manage-facility-dropdown button").should("be.visible");
  }

  fillFacilityName(name: string) {
    cy.get("#name").click().clear().click().type(name);
  }

  fillPincode(pincode: string) {
    cy.get("#pincode").click().type(pincode);
  }

  selectWard(ward: string) {
    cy.get("div#ward button").click();
    cy.get("[role='option']").contains(ward).click();
  }

  fillAddress(address: string) {
    cy.get("#address").click().type(address);
  }

  fillPhoneNumber(phoneNumber: string) {
    cy.get("#phone_number").type(phoneNumber);
  }

  submitForm() {
    cy.get("button#submit").click();
  }

  selectBedType(bedType: string) {
    cy.clickAndSelectOption("div#bed-type button", bedType);
  }

  isVisibleselectBedType() {
    cy.get("div#bed-type button").should("be.visible");
  }

  fillTotalCapacity(capacity: string) {
    cy.get("input#total-capacity").click().clear().click().type(capacity);
  }

  fillCurrentlyOccupied(occupied: string) {
    cy.get("input#currently-occupied").click().clear().click().type(occupied);
  }

  saveAndExitBedCapacityForm() {
    cy.get("button#bed-capacity-save-and-exit").click();
  }

  selectAreaOfSpecialization(area: string) {
    cy.get("div#area-of-specialization button").click();
    cy.get("[role='option']").contains(area).click();
  }

  isVisibleAreaOfSpecialization() {
    cy.get("div#area-of-specialization button").should("be.visible");
  }

  fillDoctorCount(count: string) {
    cy.get("input#count").click().clear().click().type(count);
  }

  fillOxygenCapacity(capacity: string) {
    cy.get("#oxygen_capacity").click().clear().type(capacity);
  }

  fillExpectedOxygenRequirement(requirement: string) {
    cy.get("#expected_oxygen_requirement").click().clear().type(requirement);
  }

  fillBTypeCylinderCapacity(capacity: string) {
    cy.get("#type_b_cylinders").click().clear().type(capacity);
  }

  fillExpectedBTypeCylinderRequirement(requirement: string) {
    cy.get("#expected_type_b_cylinders").focus().clear();
    cy.get("#expected_type_b_cylinders").focus().type(requirement);
  }

  fillCTypeCylinderCapacity(capacity: string) {
    cy.get("#type_c_cylinders").click().clear().type(capacity);
  }

  fillExpectedCTypeCylinderRequirement(requirement: string) {
    cy.get("#expected_type_c_cylinders").focus().clear();
    cy.get("#expected_type_c_cylinders").focus().type(requirement);
  }

  fillDTypeCylinderCapacity(capacity: string) {
    cy.get("#type_d_cylinders").click().clear().type(capacity);
  }

  fillExpectedDTypeCylinderRequirement(requirement: string) {
    cy.get("#expected_type_d_cylinders").focus().clear();
    cy.get("#expected_type_d_cylinders").focus().type(requirement);
  }

  saveAndExitDoctorForm() {
    cy.intercept("GET", "**/api/v1/facility/**").as("createFacilities");
    cy.get("button#save-and-exit").click();
    cy.wait("@createFacilities").its("response.statusCode").should("eq", 200);
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

  getTotalBedCapacity() {
    return cy.get("#total-bed-capacity");
  }

  getFacilityTotalBedCapacity() {
    return cy.get("#facility-bed-capacity-details");
  }

  getFacilityTotalDoctorCapacity() {
    return cy.get("#facility-doctor-capacity-details");
  }

  getTotalDoctorCapacity() {
    return cy.get("#total-doctor-capacity");
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

  getFacilityOxygenInfo() {
    return cy.get("#facility-oxygen-info");
  }

  clickResourceRequestOption() {
    cy.get("#resource-request").contains("Resource Request").click();
  }

  clickDeleteFacilityOption() {
    cy.get("#delete-facility").contains("Delete Facility").click();
  }

  scrollToFacilityTriage() {
    cy.get("#add-facility-triage").scrollIntoView();
  }

  fillTriageEntryFields(
    visited: string,
    homeQuarantine: string,
    isolation: string,
    referred: string,
    confirmedPositive: string,
  ) {
    cy.get("#num_patients_visited").clear().click().type(visited);
    cy.get("#num_patients_home_quarantine")
      .clear()
      .click()
      .type(homeQuarantine);
    cy.get("#num_patients_isolation").clear().click().type(isolation);
    cy.get("#num_patient_referred").clear().click().type(referred);
    cy.get("#num_patient_confirmed_positive")
      .clear()
      .click()
      .type(confirmedPositive);
  }

  fillEntryDate(date: string) {
    cy.clickAndTypeDate("#entry_date", date);
  }

  clickEditButton() {
    cy.get("#edit-button").click();
  }

  clickButtonsMultipleTimes(selector: string) {
    cy.get(selector).each(($button) => {
      cy.wrap($button).click();
    });
  }

  verifyTriageTableContains(value: string) {
    cy.get("#triage-table").contains(value);
  }

  clickAddFacilityTriage() {
    cy.get("#add-facility-triage").click();
  }

  clickfacilityfeatureoption() {
    cy.get("#features").click();
  }

  clickbedcapcityaddmore() {
    cy.get("#bed-capacity-save").click();
  }

  clickdoctorcapacityaddmore() {
    cy.get("#doctor-save").click();
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

    // Fill oxygen details if provided
    if (data.oxygen) {
      this.fillOxygenDetails(data.oxygen);
    }

    this.submitForm();
    cy.closeNotification();

    // Add bed capacity if provided
    if (data.beds) {
      this.addBedCapacities(data.beds);
    }

    // Add doctor capacity if provided
    if (data.doctors) {
      this.addDoctorCapacities(data.doctors);
    }

    this.verifyfacilitynewurl();
    return this;
  }

  fillBasicDetails(basic: FacilityData["basic"]) {
    this.fillFacilityName(basic.name);
    this.selectFacilityType(basic.type);

    if (basic.features?.length) {
      this.clickfacilityfeatureoption();
      basic.features.forEach((feature) => {
        cy.get("[role='option']").contains(feature).click();
      });
      this.clickfacilityfeatureoption();
    }

    this.fillAddress(basic.address);
    this.fillPhoneNumber(basic.phoneNumber);

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

  fillOxygenDetails(oxygen: NonNullable<FacilityData["oxygen"]>) {
    this.fillOxygenCapacity(oxygen.capacity);
    this.fillExpectedOxygenRequirement(oxygen.expected);

    if (oxygen.bType) {
      this.fillBTypeCylinderCapacity(oxygen.bType.capacity);
      this.fillExpectedBTypeCylinderRequirement(oxygen.bType.expected);
    }

    if (oxygen.cType) {
      this.fillCTypeCylinderCapacity(oxygen.cType.capacity);
      this.fillExpectedCTypeCylinderRequirement(oxygen.cType.expected);
    }

    if (oxygen.dType) {
      this.fillDTypeCylinderCapacity(oxygen.dType.capacity);
      this.fillExpectedDTypeCylinderRequirement(oxygen.dType.expected);
    }
  }

  addBedCapacities(beds: NonNullable<FacilityData["beds"]>) {
    beds.forEach((bed) => {
      this.selectBedType(bed.type);
      this.fillTotalCapacity(bed.totalCapacity);
      this.fillCurrentlyOccupied(bed.occupied);
      this.clickbedcapcityaddmore();
      cy.closeNotification();
    });
    this.clickcancelbutton();
  }

  addDoctorCapacities(doctors: NonNullable<FacilityData["doctors"]>) {
    doctors.forEach((doctor) => {
      this.selectAreaOfSpecialization(doctor.specialization);
      this.fillDoctorCount(doctor.count);
      this.clickdoctorcapacityaddmore();
      cy.closeNotification();
    });
    this.clickcancelbutton();
  }
}

export default FacilityPage;
