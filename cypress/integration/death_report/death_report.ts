import { cy, it, describe, afterEach } from "local-cypress";

describe("death_form", () => {
  const patient =
    "http://localhost:4000/facility/fdad4400-bd11-49dd-9da1-5be0e79fa14e/patient/c1f4c2a6-a8e7-494a-a2e0-00749c3f8c1f";
  it("Death Report If Expired", () => {
    cy.visit(patient);
    cy.get("div")
      .contains("EXPIRED")
      .then(() => {
        cy.get("button").contains("Death Report").click();
      });
  });
});
