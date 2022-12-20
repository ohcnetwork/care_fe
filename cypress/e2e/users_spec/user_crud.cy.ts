import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

const makeid = (length: number) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const makePhoneNumber = () =>
  "91" + Math.floor(Math.random() * 99999999).toString();

const username = makeid(25);
const phone_number = makePhoneNumber();
const alt_phone_number = makePhoneNumber();

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
    cy.get("[id='localbody'] > div > button").click();
    cy.get("div").contains("Aikaranad").click();
    cy.intercept(/\/api\/v1\/facility/).as("facility");
    cy.get("[name='facilities']").type("Mysore").wait("@facility");
    cy.get("[name='facilities']").type("{downarrow}{enter}");
    cy.get("[id='home_facility'] > div > button").click();
    cy.get("[id='home_facility']").find("div").contains("Mysore").click();
    cy.intercept(/users/).as("check_availability");
    cy.get("[name='username']").type(username, { force: true });
    cy.get("[id='date_of_birth']").click();
    cy.get("div").contains("20").click();
    cy.get("[id='year-0']").click();
    cy.get("[id='date-1']").click();
    cy.wait("@check_availability").its("response.statusCode").should("eq", 200);
    cy.get("[name='password']").type("#@Cypress_test123");
    cy.get("[name='c_password']").type("#@Cypress_test123");
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[name='email']").type("cypress@tester.com");
    cy.get("[id='gender'] > div > button").click();
    cy.get("div").contains("Male").click();
    cy.get("input[type='checkbox']").click();
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number, {
      force: true,
    });
    cy.get("button[id='submit']").contains("Save User").click({
      force: true,
    });
    cy.verifyNotification("User added successfully");
  });

  it("view user and verify details", () => {
    cy.contains("Advanced Filters").click();
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[id='role'] > div > button").click();
    cy.get("div")
      .contains(/^Ward Admin$/)
      .click();
    cy.get("input[name='district']").type("Ernakulam").wait(1000);
    cy.get("input[name='district']").type("{downarrow}{enter}");
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number);
    cy.contains("Apply").click();
    cy.intercept(/\/api\/v1\/users/).as("getUsers");
    cy.wait(1000);
    cy.get("[name='username']").type(username, { force: true });
    cy.wait("@getUsers");
    cy.wait(1000);
    cy.get("dd[id='count']").contains(/^1$/).click();
    cy.get("div[id='usr_0']").within(() => {
      cy.get("div[id='role']").contains(/^WardAdmin$/);
      cy.get("div[id='name']").contains("Cypress Test Tester");
      cy.get("div[id='district']").contains(/^Ernakulam$/);
      cy.get("div[id='local_body']").contains("Aikaranad");
      cy.get("div[id='created_by']").contains(/^devdistrictadmin$/);
      cy.get("div[id='home_facility']").contains("(Test) Mysore");
      cy.get("div").contains("Click").click({
        force: true,
      });
      cy.intercept(`/api/v1/users/${username}/get_facilities/`).as("facility");
      cy.get("div[id='facilities'] > div:nth-child(2) > div").contains(
        "(Test) Mysore"
      );
    });
  });

  it("link facility for user", () => {
    cy.contains("Advanced Filters").click();
    cy.get("[name='first_name']").type("Cypress Test");
    cy.get("[name='last_name']").type("Tester");
    cy.get("[placeholder='Phone Number']").type(phone_number);
    cy.get("[placeholder='WhatsApp Phone Number']").type(alt_phone_number);
    cy.contains("Apply").click();
    cy.intercept(/\/api\/v1\/users/).as("getUsers");
    cy.get("[name='username']").type(username, { force: true });
    cy.wait("@getUsers");
    cy.wait(500);
    const linkFacilityString = "Click here to show linked facilities";
    cy.get("div")
      .should("contain", linkFacilityString)
      .contains(linkFacilityString)
      .click({ force: true })
      .then(() => {
        cy.get("a")
          .should("contain", "Link new facility")
          .contains("Link new facility")
          .click({ force: true });
      });
    cy.intercept(/\/api\/v1\/facility/).as("getFacilities");
    cy.get("[name='facility']").type("test").wait("@getFacilities");
    cy.get("[name='facility']").type("{downarrow}{enter}");
    cy.get("button > span").contains("Add").click({ force: true }).wait(1000);
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button")
      .should("contain", ">")
      .contains(">")
      .click({ force: true });
    cy.get("button")
      .should("contain", "<")
      .contains("<")
      .click({ force: true });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});

const backspace =
  "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}";

describe("Edit Profile Testing", () => {
  before(() => {
    cy.loginByApi(username, "#@Cypress_test123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/user/profile");
    cy.contains("Edit User Profile").click({ force: true });
  });

  it("Empty First-Name field of " + username, () => {
    cy.get("input[name=firstName]").clear().trigger("change", { force: true });
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.get(".error-text").contains("Field is required");
  });

  it("Valid First-Name field of " + username, () => {
    cy.get("input[name=firstName]")
      .clear()
      .type("User 1")
      .trigger("change", { force: true });
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.wait(1000);
    cy.get("dt").contains("First Name").siblings().first().contains("User 1");
  });

  it("Empty Last-Name field of " + username, () => {
    cy.get("input[name=lastName]").clear().trigger("change", { force: true });
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.get(".error-text").contains("Field is required");
  });

  it("Valid Last-Name field of " + username, () => {
    cy.get("input[name=lastName]")
      .clear()
      .type("User 1")
      .trigger("change", { force: true });
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.wait(1000);
    cy.get("dt").contains("Last Name").siblings().first().contains("User 1");
  });

  it("Invalid Whatsapp Number of " + username, () => {
    const whatsapp_num = "11111-11111";

    cy.get(".flag-dropdown").last().find(".arrow").click();
    cy.get("li[data-flag-key='flag_no_84']").click();
    cy.get("[placeholder='WhatsApp Number']")
      .focus()
      .type(`${backspace}${whatsapp_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${whatsapp_num}`);
    cy.wait(1000);
    cy.get("form")
      .get("button[type='submit']")
      .contains("UPDATE")
      .click()
      .then(() => {
        cy.get(".error-text").contains("Please enter valid mobile number");
      });
  });

  it("Valid Whatsapp Number of " + username, () => {
    const whatsapp_num = "91111-11111";

    cy.get(".flag-dropdown").last().find(".arrow").click();
    cy.get("li[data-flag-key='flag_no_84']").click();
    cy.get("[placeholder='WhatsApp Number']")
      .focus()
      .type(`${backspace}${whatsapp_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${whatsapp_num}`);
    cy.wait(1000);
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.wait(1000);
    cy.get("dt")
      .contains("Whatsapp No")
      .siblings()
      .first()
      .contains(`+91 ${whatsapp_num}`.replace(/[ -]/g, ""));
  });

  it("Invalid Phone Number of " + username, () => {
    const phone_num = "11111-11111";

    cy.get(".flag-dropdown").first().find(".arrow").click();
    cy.get("li[data-flag-key='flag_no_84']").click();
    cy.get("[placeholder='Phone Number']")
      .focus()
      .type(`${backspace}${phone_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${phone_num}`);
    cy.wait(1000);
    cy.get("form")
      .get("button[type='submit']")
      .contains("UPDATE")
      .click()
      .then(() => {
        cy.get(".error-text").contains("Please enter valid phone number");
      });
  });

  it("Valid Phone Number of " + username, () => {
    const phone_num = "99999-99999";

    cy.get(".flag-dropdown").first().find(".arrow").click();
    cy.get("li[data-flag-key='flag_no_84']").click();
    cy.get("[placeholder='Phone Number']")
      .focus()
      .type(`${backspace}${phone_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${phone_num}`);
    cy.wait(1000);
    cy.get("form").get("button[type='submit']").contains("UPDATE").click();
    cy.wait(1000);
    cy.get("dt")
      .contains("Contact No")
      .siblings()
      .first()
      .contains(`+91 ${phone_num}`.replace(/[ -]/g, ""));
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});

describe("Delete User", () => {
  it("deletes user", () => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.awaitUrl("/user");
    cy.get("[name='username']").type(username);
    cy.get("button").should("contain", "Delete").contains("Delete").click();
    cy.get("button.font-medium.btn.btn-danger").click();
  });
});
