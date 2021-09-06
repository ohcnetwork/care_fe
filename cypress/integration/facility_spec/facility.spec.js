/// <reference types="cypress" />

// function to create and update facility
const facilityForm = (
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
  kasp_empanelled
) => {
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
  cy.get(".leaflet-crosshair").should("exist").click();
  cy.get("body").click();
  cy.get("[id=facility-save]").should("exist").click();
};

describe("Facility creation", () => {
  it("Facility workflow", () => {
    // login
    cy.visit("http://localhost:4000/");
    cy.get('input[name="username"]').type("karadmin");
    cy.get('input[name="password"]').type("passwordR0FL");
    cy.get("button").contains("Login").click();

    cy.url().should("include", "/facility");

    // create facility
    cy.visit("http://localhost:4000/facility/create");
    facilityForm(
      "Private Hospital",
      "cypress facility",
      "1",
      "7",
      "844",
      "15015",
      "some address",
      "884656",
      "9985784535",
      "20",
      "30",
      "20",
      "46",
      "43",
      "34",
      "342",
      "43",
      true
    );
    cy.verifyNotification("Facility added successfully");

    // add bed type
    cy.url().should("include", "bed");
    cy.get("[id=bed-type]").select("1");
    cy.get("[id=total-capacity]").type("150");
    cy.get("[id=currently-occupied]").type("100");
    cy.get("[id=bed-capacity-save]").click();
    cy.verifyNotification("Bed capacity added successfully");

    cy.url().should("include", "bed");
    cy.get("[id=bed-capacity-cancel]").click();

    // add doctor information
    cy.url().should("include", "doctor");
    cy.get("[id=area-of-specialization]").select("1");
    cy.get("[id=count]").type("15");
    cy.get("[id=doctor-save").click();
    cy.verifyNotification("Doctor count added successfully");

    cy.url().should("include", "doctor");
    cy.get("[id=doctor-cancel").click();

    // update facility
    cy.get("[id=update-facility").click();
    cy.url().should("include", "update");

    facilityForm(
      "Educational Inst",
      " update",
      "1",
      "7",
      "844",
      "15015",
      " update",
      "584675",
      "9985784535",
      "30",
      "40",
      "23",
      "29",
      "72",
      "84",
      "64",
      "4",
      false
    );
    cy.verifyNotification("Facility updated successfully");

    // delete facility
    cy.get("[id=facility-delete]").click();
    cy.get("[id=facility-delete-confirm]").click();
    cy.verifyNotification("Facility deleted successfully");
  });
});
