/// <reference types="cypress" />

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const username = makeid(20);

describe("Edit Profile Testing", () => {
  before(() => {
    cy.login("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit("http://localhost:4000").wait(1000);
    cy.get("a").contains("Users").click();
    cy.url().should("include", "/user");
  });

  it("create user", () => {
    cy.contains("Add New User").click();
    cy.get('[name="user_type"]').select("Volunteer");
    cy.get('[placeholder="phone_number"]').type("9343234277");
    cy.get('[placeholder="whatsapp_number"]').type("9239342343");
    cy.get('[name="facilities"]')
      .type("Harsha", { delay: 200 })
      .wait(2000)
      .type("{downarrow}{enter}");
    cy.wait(2000);
    cy.get('[name="username"').type(username);
    cy.get('[name="dob"]').type("02/03/2001");
    cy.get('[name="password"]').type("#@Cypress_test123");
    cy.get('[name="c_password"]').type("#@Cypress_test123");
    cy.get('[name="first_name"]').type("Cypress Test");
    cy.get('[name="last_name"]').type("Tester");
    cy.get('[name="email"').type("cypress@tester.com");
    cy.get('[name="gender"]').select("Male");
    cy.get('[name="state"]').select("Kerala");
    cy.get('[name="district"]').select("Ernakulam");
    //cy.get('[name="local_body"]').select("");
    cy.contains("Save User").click();
    cy.wait(2000);
    cy.verifyNotification("User added successfully");
  });

  it("view user and verify details", () => {
    cy.wait(1000);
    cy.contains("Advanced Filters").click();
    cy.wait(2000);
    cy.get('[name="first_name"]').type("Cypress Test");
    cy.get('[name="last_name"]').type("Tester");
    cy.get('[name="phone_number"]').type("9343234277");
    cy.get('[name="alt_phone_number"]').type("9239342343");
    cy.contains("Apply").click();
    cy.wait(2000);
    cy.get('[name="search"]').type(username);
    cy.wait(1000);
    // TODO: some verify task
  });

  it("update user", () => {
    cy.contains("Advanced Filters").click().wait(2000);
    cy.get('[name="first_name"]').type("Cypress Test");
    cy.get('[name="last_name"]').type("Tester");
    cy.get('[name="phone_number"]').type("9343234277");
    cy.get('[name="alt_phone_number"]').type("9239342343");
    cy.contains("Apply").click();
    cy.wait(2000);
    cy.get('[name="search"]').type(username);
    cy.wait(1000);
    cy.contains("Click here to show").click();
    cy.contains("Link new facility").click();
    cy.get('[name="facility"]')
      .type("test")
      .wait(2000)
      .type("{downarrow}{enter}");
    cy.get("button > span").contains("Add").click().wait(1000);
  });

  it("deletes user", () => {
    cy.get('[name="search"]').type(username);
    cy.wait(2000);
    cy.contains("Delete").click();
    cy.get("button.font-medium.btn.btn-danger").click();
  });

  it("Next/Previous Page", () => {
    cy.wait(1000);
    // only works for desktop mode
    cy.get("button").contains("Next").click();
    cy.wait(1000);
    cy.get("button").contains("Prev").click();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
