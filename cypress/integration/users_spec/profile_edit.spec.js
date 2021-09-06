/// <reference types="cypress" />

const username = "dummy_user_1";
const password = "Dummyuser1";
const backspace =
  "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}";

const base_url = "http://localhost:4000";
describe("Edit Profile Testing", () => {
  beforeEach(() => {
    cy.log("Logging in the user");
    cy.visit(base_url);

    // Login
    cy.get('input[name="username"]').type(username);
    cy.get("input[name='password']").type(password);
    cy.get("button").contains("Login").click();

    // Check URL
    cy.url().should("include", "/facility");
  });

  it("Empty First-Name field of " + username, () => {
    // Opening editing form

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    // Typing into firstname field
    cy.get("input[name=firstName]").clear().trigger("change", { force: true });

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get(".error-text").contains("Field is required");
  });

  it("Valid First-Name field of " + username, () => {
    // Opening editing form

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    // Typing into firstname field
    cy.get("input[name=firstName]")
      .type(backspace + "User 1")
      .trigger("change", { force: true });

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("dt").contains("First Name").siblings().first().contains(`User 1`);
  });

  it("Empty Last-Name field of " + username, () => {
    // Opening editing form

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    // Typing into lastname field
    cy.get("input[name=lastName]").clear().trigger("change", { force: true });

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get(".error-text").contains("Field is required");
  });

  it("Valid Last-Name field of " + username, () => {
    // Opening editing form

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    // Typing into lastname field
    cy.get("input[name=lastName]")
      .type(backspace + "User 1")
      .trigger("change", { force: true });

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("dt").contains("Last Name").siblings().first().contains(`User 1`);
  });

  it("Invalid Whatsapp Number of " + username, () => {
    // Opening editing form

    const whatsapp_num = "11111-11111";

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    cy.get(".flag-dropdown").last().find(".arrow").click();
    cy.get('li[data-flag-key="flag_no_84"]').click();

    // Updating the Whatsapp Number field
    cy.get("input[type='tel']")
      .last()
      .focus()
      .type(`${backspace}${whatsapp_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${whatsapp_num}`);

    // Waiting for async call to complete
    cy.wait(3000);
    cy.get("form").get("button[type='submit']").click();
    cy.get(".error-text").contains("Please enter valid mobile number");
  });

  it("Valid Whatsapp Number of " + username, () => {
    // Opening editing form

    const whatsapp_num = "91111-11111";

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    cy.get(".flag-dropdown").last().find(".arrow").click();
    cy.get('li[data-flag-key="flag_no_84"]').click();

    // Updating the Whatsapp Number field
    cy.get("input[type='tel']")
      .last()
      .focus()
      .type(`${backspace}${whatsapp_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${whatsapp_num}`);

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("dt")
      .contains("Whatsapp No")
      .siblings()
      .first()
      .contains(`+91 ${whatsapp_num}`);
  });

  // Phone Testing
  it("Invalid Phone Number of " + username, () => {
    // Opening editing form

    const phone_num = "11111-11111";

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    cy.get(".flag-dropdown").first().find(".arrow").click();
    cy.get('li[data-flag-key="flag_no_84"]').click();

    // Updating the Whatsapp Number field
    cy.get("input[type='tel']")
      .first()
      .focus()
      .type(`${backspace}${phone_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${phone_num}`);

    // Waiting for async call to complete
    cy.wait(3000);
    cy.get("form").get("button[type='submit']").click();
    cy.get(".error-text").contains("Please enter valid phone number");
  });

  it("Valid Phone Number of " + username, () => {
    // Opening editing form

    const phone_num = "99999-99999";

    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    cy.get(".flag-dropdown").first().find(".arrow").click();
    cy.get('li[data-flag-key="flag_no_84"]').click();

    // Updating the Whatsapp Number field
    cy.get("input[type='tel']")
      .first()
      .focus()
      .type(`${backspace}${phone_num}`)
      .trigger("change", { force: true })
      .should("have.attr", "value", `+91 ${phone_num}`);

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("form").get("button[type='submit']").click();

    // Waiting for async call to complete
    cy.wait(2000);
    cy.get("dt")
      .contains("Contact No")
      .siblings()
      .first()
      .contains(`+91 ${phone_num}`);
  });

  // Firstname testing
});
