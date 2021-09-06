/// <reference types="cypress" />

describe("Facility creation", () => {
  it("Facility workflow", () => {
    cy.login("karadmin", "passwordR0FL");

    // create facility
    cy.createFacility({
      type: "Private Hospital",
      name: "cypress facility",
      state: "1",
      district: "7",
      localbody: "844",
      ward: "15015",
      address: "some address",
      pincode: "884656",
      tel: "9985784535",
      oxygen_capacity: "20",
      oxygen_requirement: "30",
      type_b_cylinders: "20",
      expected_type_b_cylinders: "46",
      type_c_cylinders: "43",
      expected_type_c_cylinders: "34",
      type_d_cylinders: "342",
      expected_type_d_cylinders: "43",
      kasp_empanelled: true,
    });

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

    cy.updateFacility({
      type: "Educational Inst",
      name: " update",
      state: "1",
      district: "7",
      localbody: "844",
      ward: "15015",
      address: " update",
      pincode: "584675",
      tel: "9985784535",
      oxygen_capacity: "30",
      oxygen_requirement: "40",
      type_b_cylinders: "23",
      expected_type_b_cylinders: "29",
      type_c_cylinders: "72",
      expected_type_c_cylinders: "84",
      type_d_cylinders: "64",
      expected_type_d_cylinders: "4",
      kasp_empanelled: false,
    });

    // delete facility
    cy.get("[id=facility-delete]").click();
    cy.get("[id=facility-delete-confirm]").click();
    cy.verifyNotification("Facility deleted successfully");
  });
});
