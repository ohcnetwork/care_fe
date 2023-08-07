import { cy, describe, before, beforeEach, it, afterEach } from "local-cypress";

describe("Facility Creation", () => {
  before(() => {
    cy.viewport("iphone-x");
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.intercept("GET", "**/users/getcurrentuser/", {
      statusCode: 200,
      delay: 100,
      fixture: "general/get_current_user",
    }).as("GET currentUser");

    cy.intercept("GET", "**/capacity/", {
      statusCode: 200,
      delay: 100,
      fixture: "facility/capacity",
    }).as("GET capacity");

    cy.intercept("GET", "**/hospital_doctor/", {
      statusCode: 200,
      delay: 100,
      fixture: "facility/hospital_doctor",
    }).as("GET hospital_doctor");

    cy.intercept("PUT", "**/hospital_doctor/**", {
      statusCode: 200,
      delay: 100,
      fixture: "facility/hospital_doctor_update",
    }).as("PUT hospital_doctor_update");

    cy.intercept("GET", "**/patient_stats/", {
      statusCode: 200,
      delay: 100,
      fixture: "facility/patient_stats",
    }).as("GET patient_stats");

    cy.restoreLocalStorage();

    cy.visit("/facility/657c32be-d584-476c-9ce2-0412f0e7692e");
  });

  it("Makes sure we can update doctor's capacity", () => {
    cy.get("[data-cy='edit-button-doctor-count-cart']").first().click();

    // Make sure the update button is full width
    cy.get("[data-cy='update-button-doctor-capacity']").should(
      "have.class",
      "w-full"
    );

    // Click on the button
    cy.get("[data-cy='update-button-doctor-capacity']").click();
    cy.wait("@PUT hospital_doctor_update");

    // Make sure the toast is shown
    cy.contains("Doctor count updated successfully");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
