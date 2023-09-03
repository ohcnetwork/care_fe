let patient_url = "";

export class UpdatePatientPage {
  enterPatientDetails(
    patientName: string,
    bloodGroup: string,
    phoneNumber: string,
    emergencyPhoneNumber: string,
    address: string,
    currentHealthCondition: string,
    ongoingMedication: string,
    allergies: string,
    medicalHistory: string[],
    subscriberId: string,
    policyId: string,
    insuranceId: string,
    insuranceName: string
  ) {
    cy.wait(10000);
    cy.get("#address").scrollIntoView();
    cy.get("#address").should("be.visible");
    cy.get("#address").type(address);
    cy.get("[data-testid=name] input").clear();
    cy.get("[data-testid=name] input").type(patientName);
    cy.get("#phone_number-div").clear();
    cy.get("#phone_number-div").type("+91").type(phoneNumber);
    cy.get("#emergency_phone_number-div").clear();
    cy.get("#emergency_phone_number-div")
      .type("+91")
      .type(emergencyPhoneNumber);
    cy.get("#present_health").type(currentHealthCondition);
    cy.get("#ongoing_medication").type(ongoingMedication);
    cy.get("#allergies").type(allergies);
    cy.get("[name=medical_history_check_1]").uncheck();
    cy.get("[name=medical_history_check_2]").check();
    cy.get("#medical_history_2").type(medicalHistory[0]);
    cy.get("[name=medical_history_check_3]").check();
    cy.get("#medical_history_3").type(medicalHistory[1]);
    cy.get("button").get("[data-testid=add-insurance-button]").click();
    cy.get("#subscriber_id").type(subscriberId);
    cy.get("#policy_id").type(policyId);
    cy.get("#insurer_id").type(insuranceId);
    cy.get("#insurer_name").type(insuranceName);
    cy.get("[data-testid=blood-group] button")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(bloodGroup).click();
      });
  }

  clickUpdatePatient() {
    cy.get("button").get("[data-testid=submit-button]").click();
  }

  verifyPatientUpdated() {
    cy.url().should("include", "/patient");
  }

  saveUpdatedPatientUrl() {
    cy.url().then((url) => {
      cy.log(url);
      patient_url = url.split("/").slice(0, -1).join("/");
      cy.log(patient_url);
    });
  }

  visitUpdatedPatient() {
    cy.awaitUrl(patient_url);
  }

  verifyPatientDetails(
    patientName: string,
    phoneNumber: string,
    patientDetails_values: string[]
  ) {
    cy.url().should("include", "/facility/");
    cy.get("[data-testid=patient-dashboard]").should("contain", patientName);
    cy.get("[data-testid=patient-dashboard]").should("contain", phoneNumber);
    patientDetails_values.forEach((value) => {
      cy.get("[data-testid=patient-details]").should("contain", value);
    });
  }

  visitConsultationPage() {
    cy.visit(patient_url + "/consultation");
  }
}
