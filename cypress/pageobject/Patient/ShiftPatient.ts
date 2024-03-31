import { cy } from "local-cypress";
export class ShiftPatient {
  visitShiftPatient() {
    cy.get("#shift_patient").click({ force: true });
  }
  typeContactPersonName(name: string) {
    cy.get("#refering_facility_contact_name").type(name);
  }
  typePhoneNumber(phone: string) {
    cy.get("#refering_facility_contact_number").type(phone);
  }
  selectFacility(facility: string) {
    cy.searchAndSelectOption("input[name=assigned_facility]", facility);
  }
  selectPatientCategory(category: string) {
    cy.clickAndSelectOption("#patient_category", category);
  }
  typeReasonForShift(reason: string) {
    cy.get("textarea[name=reason]").type(reason);
  }
  typeNameOfDriver(name: string) {
    cy.get("input[name=ambulance_driver_name]").type(name);
  }
  typeAmbulancePhoneNumber(phone: string) {
    cy.get("#ambulance_phone_number").type(phone);
  }
  typeAmbulanceNumber(num: string) {
    cy.get("#ambulance_number").type(num);
  }
  typeOtherComments(comment: string) {
    cy.get("textarea[name=comments]").type(comment);
  }
  clickSubmitButton() {
    cy.intercept("POST", "**/api/v1/shift/").as("createSampleRequest");
    cy.get("#submit").click();
    cy.wait("@createSampleRequest")
      .its("response.statusCode")
      .should("eq", 201);
  }
  clickCancelButton() {
    cy.get("#cancel").click();
  }
}
