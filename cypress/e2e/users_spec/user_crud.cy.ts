import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

const makeid = (length: number) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const username = makeid(25);
const phone_number = 9999999999;
const alt_phone_number = 9999999999;

describe("User management", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/user");
  });

  it("create user", () => {
    cy.contains("Add New User").click();
    cy.get("[id='user_type'] > div > button").click();
    cy.get("div").contains("Ward Admin").click();
    cy.get("[id='state'] > div > button").click();
    cy.get("div").contains("Kerala").click();
    cy.get("[id='district'] > div > button").click();
    cy.get("div").contains("Ernakulam").click();
    cy.get("[id='local_body'] > div > button").click();
    cy.get("div").contains("Aikaranad").click();
    cy.intercept(/\/api\/v1\/facility/).as("facility");
    cy.get("[name='facilities']")
      .click()
      .type("cypress facility")
      .wait("@facility");
    cy.get("li[role='option']").first().click();
    cy.get("input[type='checkbox']").click();
    cy.get("[name='phone_number']").type(phone_number);
    cy.get("[name='alt_phone_number']").type(alt_phone_number);
    cy.intercept(/users/).as("check_availability");
    cy.get("[id='date_of_birth']").click();
    cy.get("div").contains("20").click();
    cy.get("[id='year-0']").click();
    cy.get("[id='date-1']").click();
    cy.get("[name='username']").type(username);
    cy.wait("@check_availability").its("response.statusCode").should("eq", 200);
    cy.get("[name='password']").type("#@Cypress_test123");
    cy.get("[name='c_password']").type("#@Cypress_test123");
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[name='email']").type("cypress@tester.com");
    cy.get("[id='gender'] > div > button").click();
    cy.get("div").contains("Male").click();
    cy.get("button[id='submit']").contains("Save User").click();
    cy.verifyNotification("User added successfully");
  });

  it("view user and verify details", () => {
    cy.contains("Advanced Filters").click();
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("#role button").click();
    cy.contains("#role li", "Ward Admin").click();
    cy.get("input[name='district']").click();
    cy.get("input[name='district']").type("Ernakulam");
    cy.get("li[id^='headlessui-combobox-option']")
      .contains("Ernakulam")
      .click();
    cy.get("[placeholder='Phone Number']").click();
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number);
    cy.contains("Apply").click();
    cy.intercept(/\/api\/v1\/users/).as("getUsers");
    cy.wait(1000);
    cy.get("[name='username']").type(username);
    cy.wait("@getUsers");
    cy.get("dd[id='count']").contains(/^1$/).click();
    cy.get("div[id='usr_0']").within(() => {
      cy.intercept(`/api/v1/users/${username}/get_facilities/`).as(
        "userFacility"
      );
      cy.get("div[id='role']").contains(/^WardAdmin$/);
      cy.get("div[id='name']").contains("Cypress Test Tester");
      cy.get("div[id='district']").contains(/^Ernakulam$/);
      cy.get("div[id='local_body']").contains("Aikaranad");
      cy.get("div[id='created_by']").contains(/^devdistrictadmin$/);
      cy.get("div[id='home_facility']").contains("No Home Facility");
      cy.get("button[id='facilities']").click();
      cy.wait("@userFacility")
        .getAttached("div[id=facility_0] > div > span")
        .contains("cypress facility");
    });
  });

  it("link facility for user", () => {
    cy.contains("Linked Facilities").click();
    cy.intercept(/\/api\/v1\/facility/).as("getFacilities");
    cy.get("[name='facility']")
      .click()
      .type("cypress facility")
      .wait("@getFacilities");
    cy.get("li[role='option']").first().click();
    cy.intercept(/\/api\/v1\/users\/\w+\/add_facility\//).as("addFacility");
    cy.get("button[id='link-facility']").click();
    cy.wait("@addFacility")
      // .its("response.statusCode")
      // .should("eq", 201)
      .get("span")
      .contains("Facility - User Already has permission to this facility");
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button#next-pages").click();
    cy.url().should("include", "page=2");
    cy.get("button#prev-pages").click();
    cy.url().should("include", "page=1");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});

describe("Edit User Profile & Error Validation", () => {
  before(() => {
    cy.loginByApi(username, "#@Cypress_test123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/user/profile");
    cy.contains("button", "Edit User Profile").click();
  });

  it("First name Field Updation " + username, () => {
    cy.get("input[name=firstName]").clear();
    cy.contains("button[type='submit']", "Update").click();
    cy.get("span.error-text").should("contain", "Field is required");
    cy.get("input[name=firstName]").type("firstName updated");
    cy.contains("button[type='submit']", "Update").click();
  });

  it("Last name Field Updation " + username, () => {
    cy.get("input[name=lastName]").clear();
    cy.contains("button[type='submit']", "Update").click();
    cy.get("span.error-text").should("contain", "Field is required");
    cy.get("input[name=lastName]").type("lastName updated");
    cy.contains("button[type='submit']", "Update").click();
  });

  it("Age Field Updation " + username, () => {
    cy.get("input[name=age]").clear();
    cy.contains("button[type='submit']", "Update").click();
    cy.get("span.error-text").should("contain", "This field is required");
    cy.get("input[name=age]").type("11");
    cy.contains("button[type='submit']", "Update").click();
  });

  it("Phone number Field Updation " + username, () => {
    cy.get("input[name=phoneNumber]").clear();
    cy.contains("button[type='submit']", "Update").click();
    cy.get("span.error-text").should(
      "contain",
      "Please enter valid phone number"
    );
    cy.get("input[name=phoneNumber]").type("+919999999999");
    cy.contains("button[type='submit']", "Update").click();
  });

  it("Whatsapp number Field Updation " + username, () => {
    cy.get("input[name=altPhoneNumber]").clear();
    cy.get("input[name=altPhoneNumber]").type("+919999999999");
    cy.contains("button[type='submit']", "Update").click();
  });

  it("Email Field Updation " + username, () => {
    cy.get("input[name=email]").clear();
    cy.contains("button[type='submit']", "Update").click();
    cy.get("span.error-text").should("contain", "This field is required");
    cy.get("input[name=email]").type("test@test.com");
    cy.contains("button[type='submit']", "Update").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});

// describe("Delete User", () => { district admin wont be able to delete user
//   it("deletes user", () => {
//     cy.loginByApi("devdistrictadmin", "Coronasafe@123");
//     cy.awaitUrl("/user");
//     cy.get("[name='username']").type(username);
//     cy.get("button")
//       .should("contain", "Delete")
//       .contains("Delete")
//       .click();
//     cy.get("button.font-medium.btn.btn-danger").click();
//   });
// });
