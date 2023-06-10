/// <reference types="cypress" />

import { cy, describe, before, beforeEach, it } from "local-cypress";
import { v4 as uuidv4 } from "uuid";

describe("Asset", () => {
  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/assets");
  });

  it("Create an Asset", () => {
    cy.get("button").should("contain", "Create Asset");
    cy.get("[data-testid=create-asset-buttom] button").click();
    cy.get("input[name='facilities']")
      .type("Govt Hosp, Ernakulam")
      .then(() => {
        cy.get("[role='option']").contains("Govt Hosp, Ernakulam").click();
      });
    cy.get("button").should("contain", "Select");
    cy.get("button").get("#submit").click();
    cy.get("[data-testid=asset-name-input] input").type("New Test Asset");
    cy.get("[data-testid=asset-location-input] input").type(
      "Test Location{enter}"
    );
    cy.get("[data-testid=asset-type-input] button")
      .click()
      .then(() => {
        cy.get("li").contains("Internal").click();
      });
    cy.get("[data-testid=asset-class-input] button")
      .click()
      .then(() => {
        cy.get("li").contains("ONVIF Camera").click();
      });
    cy.get("[data-testid=asset-description-input] textarea").type(
      "Test Description"
    );
    cy.get("[data-testid=asset-working-status-input] li")
      .contains("Working")
      .click();
    const qr_id = uuidv4();
    cy.get("[data-testid=asset-qr-id-input] input").type(qr_id);
    cy.get("[data-testid=asset-manufacturer-input] input").type(
      "Manufacturer's Name"
    );
    cy.get("[data-testid=asset-warranty-input] input").type("2025-12-25");
    cy.get("[data-testid=asset-support-name-input] input").type(
      "Customer Support's Name"
    );
    const phone_number = "9" + parseInt((Math.random() * 10 ** 9).toString());
    cy.get("#customer-support-phone-div").type(phone_number);
    cy.get("[data-testid=asset-support-email-input] input").type(
      "email@support.com"
    );
    cy.get("[data-testid=asset-vendor-name-input] input").type("Vendor's Name");
    const serial_no = parseInt((Math.random() * 10 ** 10).toString());
    cy.get("[data-testid=asset-serial-number-input] input").type(serial_no);
    cy.get("[data-testid=asset-last-serviced-on-input] input").type(
      "2021-12-25"
    );
    cy.get("[data-testid=asset-notes-input] textarea").type(
      "Test note for asset creation!"
    );
    cy.get("#submit").contains("Create Asset").click();
    cy.verifyNotification("Asset created successfully");
  });

  it("Search Asset Name", () => {
    const initialUrl = cy.url();
    cy.get("[name='search']").type("dummy camera 30");
    cy.get("[name='search']").type("{enter}");
    cy.url().should((currentUrl) => {
      expect(currentUrl).not.to.equal(initialUrl);
    });
  });

  it("Scan Asset QR", () => {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  });

  it("Next/Previous Page", () => {
    // only works for desktop mode
    cy.get("button")
      .should("contain", "Next")
      .contains("Next")
      .click({ force: true });
    cy.get("button")
      .should("contain", "Previous")
      .contains("Previous")
      .click({ force: true });
  });
});
