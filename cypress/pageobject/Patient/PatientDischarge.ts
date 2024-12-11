class PatientDischarge {
  clickDischarge() {
    cy.get("#show-more").scrollIntoView();
    cy.verifyAndClickElement("#show-more", "Manage Patient");
    cy.verifyAndClickElement("#show-more", "Discharge from CARE");
  }

  selectDischargeReason(reason: string) {
    if (reason == "Recovered") {
      cy.intercept("GET", "**/api/v1/consultation/*/prescriptions/*").as(
        "getPrescriptions",
      );
      cy.clickAndSelectOption("#discharge_reason", reason);
      cy.wait("@getPrescriptions").its("response.statusCode").should("eq", 200);
    } else if (reason == "Referred") {
      cy.intercept("GET", "**/api/v1/getallfacilities/**").as("getFacilities");
      cy.clickAndSelectOption("#discharge_reason", reason);
      cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    } else {
      cy.clickAndSelectOption("#discharge_reason", reason);
    }
  }

  typeDischargeNote(note: string) {
    cy.get("#discharge_notes").type(note);
  }

  typeReferringFacility(facility: string) {
    cy.typeAndSelectOption("#facility-referredto", facility);
  }

  clickClearButton() {
    cy.get("#clear-button").click();
  }

  typeDoctorName(doctorName: string) {
    cy.get("#death_confirmed_by").type(doctorName);
  }

  interceptDischargePatient() {
    cy.intercept("POST", "**/api/v1/consultation/*/discharge_patient/").as(
      "postDischarge",
    );
  }

  verifyDischargePatient() {
    cy.wait("@postDischarge").its("response.statusCode").should("eq", 200);
  }
}

export default PatientDischarge;
