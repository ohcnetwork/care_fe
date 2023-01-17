import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

class facility {
  static create(facility) {
    cy.awaitUrl("/facility/create");
    this.fillForm({
      ...facility,
      latitude: 800,
      longitude: 500,
    });
    cy.get("[id=submit]").should("exist").click();
    cy.verifyNotification("Facility added successfully");
  }

  static update(facility) {
    cy.get("[id=manage-facility-dropdown]").should("exist").click();
    cy.get("[id=update-facility]").click();
    cy.url().should("include", "update");
    this.fillForm({
      ...facility,
      latitude: 900,
      longitude: 600,
    });
    cy.get("[id=submit]").should("exist").click();
    cy.verifyNotification("Facility updated successfully");
  }

  static fillForm({
    type,
    name,
    features,
    address,
    pincode,
    tel,
    state,
    district,
    localbody,
    ward,
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
    cy.get("div").contains(type).click();

    cy.get("input[id=facility-name]").should("exist").type(name);

    cy.get("[id=facility-features] > div > div > button").click();
    cy.get("li").contains(features[0]).click();
    cy.get("li").contains(features[1]).click();
    cy.get("body").click();

    cy.get("[id=facility-state] > div > button").click();
    cy.get("div").contains(state).click();

    cy.get("[id=facility-district] > div > button").click();
    cy.get("div").contains(district).click();

    cy.get("[id=facility-localbody] > div > button").click();
    cy.get("div").contains(localbody).click();

    cy.get("[id=facility-ward] > div > button").click();
    cy.get("div").contains(ward).click();

    cy.get("textarea[id=facility-address]").should("exist").type(address);

    cy.get("input[id=facility-pincode]").should("exist").clear().type(pincode);

    cy.get("input[type=tel]").should("exist").type(tel);

    cy.get("input[id=facility-oxygen_capacity]").clear().type(oxygen_capacity);
    cy.get("input[id=facility-expected_oxygen_requirement]")
      .should("exist")
      .clear()
      .type(oxygen_requirement);

    cy.get("input[id=facility-type_b_cylinders]")
      .should("exist")
      .clear()
      .type(type_b_cylinders);
    cy.get("input[id=facility-expected_type_b_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_b_cylinders);

    cy.get("input[id=facility-type_c_cylinders]")
      .should("exist")
      .clear()
      .type(type_c_cylinders);
    cy.get("input[id=facility-expected_type_c_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_c_cylinders);

    cy.get("input[id=facility-type_d_cylinders]")
      .should("exist")
      .clear()
      .type(type_d_cylinders);
    cy.get("input[id=facility-expected_type_d_cylinders]")
      .should("exist")
      .clear()
      .type(expected_type_d_cylinders);

    cy.get("[id=facility-location-button]").click();
    cy.get("body").wait(7000).click(latitude, longitude);
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
      features: ["CT Scan", "X-Ray"],
      state: "Kerala",
      district: "Ernakulam",
      localbody: "Alangad",
      ward: "MANAKKAPADY",
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

    cy.verifyNotification("Facility added successfully");

    // add bed type
    cy.get("[id=bed-type] > div > button").click();
    cy.get("div").contains("Non-Covid Ordinary Beds").click();
    cy.get("input[id=total-capacity]").should("exist").type("150");
    cy.get("input[id=currently-occupied]").should("exist").type("100");
    cy.get("[id=bed-capacity-save-and-exit]").click();

    cy.verifyNotification("Bed capacity added successfully");

    // add doctor information
    cy.get("[id=area-of-specialization] > div > button").click();
    cy.get("ul > li:nth-child(2)").click();
    cy.get("[id=count]").type("15");
    cy.get("[id=submit").click();

    cy.verifyNotification("Doctor count added successfully");
    cy.url().then((url) => {
      current_url = url;
    });
  });

  it("update facility", () => {
    facility.update({
      type: "TeleMedicine",
      name: " update",
      features: ["X-Ray", "Neonatal Care"],
      state: "Kerala",
      district: "Ernakulam",
      localbody: "Aikaranad",
      ward: "PAZHAMTHOTTAM",
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
    cy.verifyNotification("Facility updated successfully");
    cy.url().then((url) => {
      current_url = url;
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
