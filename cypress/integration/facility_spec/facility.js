/// <reference types="cypress" />

class facility {
  static create(facility) {
    cy.visit("http://localhost:4000/facility/create");
    fillFacilityForm(facilityDetails);
    cy.get("[id=facility-save]").should("exist").click();
    cy.verifyNotification("Facility added successfully");
  }

  static update(facility) {
    cy.get("[id=update-facility").click();
    cy.url().should("include", "update");
    fillFacilityForm(facilityDetails);
    cy.get("[id=facility-save]").should("exist").click();
    cy.verifyNotification("Facility updated successfully");
  }

  static fillForm({
    type,
    name,
    state,
    district,
    localbody,
    ward,
    address,
    pincode,
    tel,
    oxygen_capacity,
    oxygen_requirement,
    type_b_cylinders,
    expected_type_b_cylinders,
    type_c_cylinders,
    expected_type_c_cylinders,
    type_d_cylinders,
    expected_type_d_cylinders,
    kasp_empanelled,
  }) {
    cy.get("[data-test=facility-type] select").should("exist").select(type);
    cy.get("[id=facility-name]").should("exist").type(name);
    cy.get("[data-test=facility-state] select").should("exist").select(state);
    cy.get("[data-test=facility-district] select")
      .should("exist")
      .select(district);
    cy.get("[data-test=facility-localbody] select")
      .should("exist")
      .select(localbody);
    cy.get("[data-test=facility-ward] select").should("exist").select(ward);

    cy.get("[id=facility-address]").type(address);
    cy.get("[id=facility-pincode]").should("exist").clear().type(pincode);
    cy.get("input[type=tel]").should("exist").type(tel);

    cy.get("[id=facility-oxygen-capacity]").clear().type(oxygen_capacity);

    cy.get("[id=facility-oxygen-requirement]")
      .should("exist")
      .clear()
      .type(oxygen_requirement);

    cy.get("[id=facility-type-b-cylinders]")
      .should("exist")
      .clear()
      .type(type_b_cylinders);

    cy.get("[id=facility-expected-type-b-cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_b_cylinders);

    cy.get("[id=facility-type-c-cylinders]")
      .should("exist")
      .clear()
      .type(type_c_cylinders);

    cy.get("[id=facility-expected-type-c-cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_c_cylinders);

    cy.get("[id=facility-type-d-cylinders]")
      .should("exist")
      .clear()
      .type(type_d_cylinders);

    cy.get("[id=facility-expected-type-d-cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_d_cylinders);

    cy.get(`[id=facility-kasp-empanelled] input[value=${kasp_empanelled}]`)
      .should("exist")
      .check();

    cy.get("[id=facility-location-button]").click();
    cy.get("body").click();
  }
}
