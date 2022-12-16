import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

class facility {
  static create(facility) {
    cy.awaitUrl("/facility/create");
    this.fillForm({
      ...facility,
      type: 1,
      features: [1, 3],
      latitude: 800,
      longitude: 500,
    });
    cy.get("[id=facility-save]").should("exist").click();
    cy.verifyNotification("Facility added successfully");
  }

  static update(facility) {
    cy.get("[id=manage-facility-dropdown]").should("exist").click();
    cy.get("[id=update-facility]").click();
    cy.url().should("include", "update");
    this.fillForm({
      ...facility,
      type: 3,
      features: [3, 4],
      latitude: 900,
      longitude: 600,
    });
    cy.get("[id=facility-save]").should("exist").click();
    cy.verifyNotification("Facility updated successfully");
  }

  static fillForm({
    type,
    name,
    features,
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
    latitude,
    longitude,
  }) {
    cy.get("[id=facility-type] > div > button").click();
    cy.get(`ul > li:nth-child(${type})`).click();

    cy.get("[id=facility-name]").should("exist").type(name);

    cy.get("[id=facility-features] > div > div > button").click();
    cy.get(`ul > li:nth-child(${features[0]})`).click();
    cy.get(`ul > li:nth-child(${features[1]})`).click();
    cy.get("body").click();

    cy.get("[id=facility-state] > div > button").click();
    cy.get("ul > li:nth-child(2)").click();

    cy.get("[id=facility-district] > div > button").click();
    cy.get("ul > li:nth-child(3)").click();

    cy.get("[id=facility-localbody] > div > button").click();
    cy.get("ul > li:nth-child(3)").click();

    cy.get("[id=facility-ward] > div > button").click();
    cy.get("ul > li:nth-child(2)").click();

    cy.get("[id=facility-address]").type(address);

    cy.get("[id=facility-pincode]").should("exist").clear().type(pincode);

    cy.get("input[type=tel]").should("exist").type(tel);

    cy.get("[id=facility-oxygen_capacity]").clear().type(oxygen_capacity);
    cy.get("[id=facility-expected_oxygen_requirement]")
      .should("exist")
      .clear()
      .type(oxygen_requirement);

    cy.get("[id=facility-type_b_cylinders]")
      .should("exist")
      .clear()
      .type(type_b_cylinders);
    cy.get("[id=facility-expected_type_b_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_b_cylinders);

    cy.get("[id=facility-type_c_cylinders]")
      .should("exist")
      .clear()
      .type(type_c_cylinders);
    cy.get("[id=facility-expected_type_c_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_c_cylinders);

    cy.get("[id=facility-type_d_cylinders]")
      .should("exist")
      .clear()
      .type(type_d_cylinders);
    cy.get("[id=facility-expected_type_d_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_d_cylinders);

    cy.get("[id=facility-location-button]").click();
    cy.get("body").wait(6000).click(latitude, longitude);
    cy.get("body").click();
  }
}

let current_url = "/";

describe("Facility", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl(current_url);
  });

  it("create facility", () => {
    facility.create({
      type: "Private Hospital",
      name: "cypress facility",
      features: [1, 3],
      state: "Kerala",
      district: "Ernakulam",
      localbody: "Alangad  Block Panchayat, Ernakulam District",
      ward: "1: MANAKKAPADY",
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
      latitude: "-4.214943141390639",
      longitude: "1.494140625",
    });

    // add bed type
    cy.url().should("include", "bed");
    cy.get("[id=bed-type] > div > button").click();
    cy.get("ul > li:nth-child(2)").click();
    cy.get("[id=total-capacity]").type("150");
    cy.get("[id=currently-occupied]").type("100");
    cy.get("[id=bed-capacity-save]").click();
    cy.verifyNotification("Bed capacity added successfully");

    cy.url().should("include", "bed");
    cy.get("[id=bed-capacity-cancel]").click();

    // add doctor information
    cy.get("button")
      .should("contain", "Add Doctor Types")
      .contains("Add Doctor Types")
      .click({ force: true });
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

  it("update facility", () => {
    facility.update({
      type: "TeleMedicine",
      name: " update",
      features: [1, 4],
      state: "Kerala",
      district: "Ernakulam",
      localbody: "Alangad  Block Panchayat, Ernakulam District",
      ward: "1: MANAKKAPADY",
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
      latitude: "-16.97274101999901",
      longitude: "11.77734375",
    });
    cy.url().then((url) => {
      current_url = url;
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
