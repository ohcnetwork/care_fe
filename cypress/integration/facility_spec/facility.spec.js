/// <reference types="cypress" />

class facility {
  static create(facility) {
    cy.visit("http://localhost:4000/facility/create");
    this.fillForm(facility);
    cy.get("[id=facility-save]").should("exist").click();
    cy.verifyNotification("Facility added successfully");
  }

  static update(facility) {
    cy.get("[id=update-facility").click();
    cy.url().should("include", "update");
    this.fillForm(facility);
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

let current_url = "http://localhost:4000";

describe("Facility", () => {
  before(() => {
    cy.login("karadmin", "passwordR0FL");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit(current_url);
  });

  it("creats facility", () => {
    facility.create({
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
    cy.url().then((url) => {
      current_url = url;
    });
  });

  it("updates facility", () => {
    cy.visit(current_url);
    facility.update({
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
    cy.url().then((url) => {
      current_url = url;
    });
  });

  it("deletes facility", () => {
    cy.visit(current_url);
    cy.get("[id=facility-delete]").click();
    cy.get("[id=facility-delete-confirm]").click();
    cy.verifyNotification("Facility deleted successfully");
    cy.url().then((url) => {
      current_url = url;
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
