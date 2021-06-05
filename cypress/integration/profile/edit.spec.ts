import { cy, it, describe, afterEach } from "local-cypress";

const username = "dummy_user_1";
const password = "Dummyuser1";

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

  it("Edit Whatsapp Number of " + username, () => {
    // Opening editing form
    cy.get("a").contains("Profile").click();
    cy.url().should("include", "/user/profile");
    cy.get("button").contains("Edit User Profile").click();

    //Editing Whatsapp Number
    // cy.get(".react-tel-input").as("phone");
    cy.get(".flag-dropdown").last().find(".arrow").click();
    cy.get('li[data-flag-key="flag_no_84"]').click();

    cy.get("input[type='tel']")
      .last()
      .focus()
      .type(
        "{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}1111111111"
      )
      .trigger("change", { value: "1111111111", force: true })
      .should("have.attr", "value", "+91 11111-11111");

    cy.wait(3000);
    cy.get("form").get("button[type='submit']").click();
    cy.get(".error-text").contains("Please enter valid mobile number");
  });
});
