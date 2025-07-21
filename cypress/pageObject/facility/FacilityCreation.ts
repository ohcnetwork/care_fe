export class FacilityCreation {
  // Navigation
  navigateToGovernance(governanceName: string) {
    cy.verifyAndClickElement('[data-cy="dashboard-sections"]', "Governance");
    cy.verifyAndClickElement(
      '[data-cy="governance-panel-list"]',
      governanceName,
    );
    return this;
  }

  navigateToFacilitiesList() {
    cy.verifyAndClickElement('[data-cy="org-nav-facilities"]', "Facilities");
    return this;
  }

  selectFirstRandomFacility() {
    cy.verifyAndClickElement(
      "[data-cy='facilities-panel-list']",
      "View facility details",
    );
    cy.get("[data-sidebar='rail']").click();
    cy.wait(1000);
    return this;
  }

  clickAddFacility() {
    cy.get('[data-cy="add-facility-button"]').should("be.visible").click();
    return this;
  }

  // Individual field methods
  enterFacilityName(name: string) {
    cy.typeIntoField('[data-cy="facility-name"]', name);
    return this;
  }

  selectFacilityType(facilityType: string) {
    cy.clickAndSelectOption('[data-cy="facility-type"]', facilityType);
    return this;
  }

  enterDescription(description: string) {
    cy.typeIntoField('[data-cy="facility-description"]', description);
    return this;
  }

  enterPhoneNumber(phone: string) {
    cy.typeIntoField('[data-cy="facility-phone"]', phone, {
      skipVerification: true,
    });
    return this;
  }

  enterPincode(pincode: string) {
    cy.typeIntoField('[data-cy="facility-pincode"]', pincode);
    return this;
  }

  enterAddress(address: string) {
    cy.typeIntoField('[data-cy="facility-address"]', address);
    return this;
  }

  enterLatitude(latitude: string) {
    cy.typeIntoField('[data-cy="facility-latitude"]', latitude);
    return this;
  }

  enterLongitude(longitude: string) {
    cy.typeIntoField('[data-cy="facility-longitude"]', longitude);
    return this;
  }

  // Combined methods using individual functions
  fillBasicDetails(name: string, facilityType: string, description: string) {
    this.enterFacilityName(name);
    this.selectFacilityType(facilityType);
    this.enterDescription(description);
    return this;
  }

  selectFeatures(features: string[]) {
    cy.clickAndMultiSelectOption("#facility-features", features);
    return this;
  }

  fillContactDetails(phone: string, pincode: string, address: string) {
    this.enterPhoneNumber(phone);
    this.enterPincode(pincode);
    this.enterAddress(address);
    return this;
  }

  fillLocationDetails(location: string) {
    cy.typeAndSelectOption('[data-cy="location-search"]', location);
    return this;
  }

  submitFacilityCreationForm() {
    cy.clickSubmitButton("Create Facility");
    return this;
  }

  interceptFacilityCreation() {
    cy.intercept("POST", "**/api/v1/facility/").as("facilityCreation");
    return this;
  }

  verifyFacilityCreation() {
    cy.wait("@facilityCreation").its("response.statusCode").should("eq", 200);
    return this;
  }

  // Verification Methods
  verifySuccessMessage() {
    cy.verifyNotification("Facility created successfully");
    return this;
  }

  verifyValidationErrors() {
    cy.verifyErrorMessages([
      { label: "Facility Name", message: "Name is required" },
      { label: "Facility Type", message: "Facility type is required" },
      { label: "Address", message: "Address is required" },
      {
        label: "Phone Number",
        message: "This field is required",
      },
      { label: "Pincode", message: "Required" },
    ]);
    return this;
  }

  searchFacility(facilityName: string) {
    cy.intercept("GET", `**/api/v1/facility/?**`).as("searchFacility");

    // Split string into array of characters using spread in Array.from
    Array.from(facilityName).forEach((char, index) => {
      cy.get('[data-cy="search-facility"]').type(char, {
        delay: 200,
      });

      // Wait for the last character's API call
      if (index === facilityName.length - 1) {
        cy.wait("@searchFacility").its("response.statusCode").should("eq", 200);
      }
    });
    return this;
  }

  verifyFacilityNameInCard(facilityName: string) {
    cy.get('[data-cy="facility-cards"]').should("contain", facilityName);
    return this;
  }

  waitForFacilityCardsToLoad(timeout = 10000) {
    cy.get('[data-cy="facility-cards"]', { timeout })
      .should("be.visible")
      .should("not.be.empty");
    return this;
  }

  fillLocationHierarchy(
    location: Partial<{
      state: string;
      district: string;
      localBody: string;
      ward: string;
    }>,
  ) {
    if (location.state) {
      cy.typeAndSelectOption('[data-cy="select-state"]', location.state, false);
    }
    if (location.district) {
      cy.typeAndSelectOption(
        '[data-cy="select-district"]',
        location.district,
        false,
      );
    }
    if (location.localBody) {
      cy.typeAndSelectOption(
        '[data-cy="select-local_body"]',
        location.localBody,
        false,
      );
    }
    if (location.ward) {
      cy.typeAndSelectOption('[data-cy="select-ward"]', location.ward, false);
    }
    return this;
  }

  verifyFacilityDetails(
    facilityName: string,
    facilityType: string,
    address: string,
  ) {
    cy.verifyAndClickElement(
      '[data-cy="view-facility-button"]',
      "View Facility",
    );
    cy.verifyContentPresence('[data-cy="facility-address-details"]', [address]);
    cy.verifyContentPresence('[data-cy="facility-name-card"]', [facilityName]);
    cy.verifyContentPresence('[data-cy="facility-type-card"]', [facilityType]);
    return this;
  }
}
