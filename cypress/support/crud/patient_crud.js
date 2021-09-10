Cypress.Commands.add("createPatient", (patient) => {
  cy.visit(`http://localhost:4000/facility/${patient.facility_id}`);
  cy.contains(/\.*Add Details of a Patient\.*/).click();

  cy.get("[data-testid=phone-number] input").type(patient.phone_number);
  cy.get("[data-testid=date-of-birth] svg").click();
  cy.get("div").contains(patient.dob.year).click();
  cy.get("span").contains("OK").click();
  cy.get("[data-testid=name] input").type(patient.name);
  cy.get("[data-testid=Gender] select").select(patient.gender);
  cy.get("[data-testid=state] select").select(patient.state);
  cy.get("[data-testid=district] select").select(patient.district);
  cy.get("[data-testid=localbody] select").select(patient.localbody);
  cy.get("[data-testid=current-address] textarea").type(
    patient.current_address
  );
  cy.get("[data-testid=permanent-address] input").check();
  cy.get("[data-testid=ward-respective-lsgi] select").select(patient.lsg);
  cy.get("[data-testid=pincode] input").type(patient.pincode);
  cy.get("[data-testid=blood-group] select").select(patient.bloodgroup);
  cy.get("[data-testid=emergency-phone-number] input").type(
    patient.emergency_phone_number,
    { delay: 100 }
  );
  cy.get("[data-testid=pincode] input").click();
  cy.get("[data-testid=submit-button]").click();
  cy.url().should("include", "/consultation");
});
