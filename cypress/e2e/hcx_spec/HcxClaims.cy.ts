import { HcxClaims } from "pageobject/Hcx/HcxClaims";
import { PatientConsultationPage } from "pageobject/Patient/PatientConsultation";
import PatientInsurance from "pageobject/Patient/PatientInsurance";

import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

describe("HCX Claims configuration and approval workflow", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientConsultationPage = new PatientConsultationPage();
  const patientInsurance = new PatientInsurance();
  const hcxClaims = new HcxClaims();
  const hcxPatientName = "Dummy Patient Thirteen";
  const firstInsuranceIdentifier = "insurance-details-0";
  const patientMemberId = "001";
  const patientPolicyId = "100";
  const patientInsurerName = "Demo Payor";

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Verify the HCX Workflow for a patient with mocked eligibility", () => {
    // Modify the insurance for a facility
    patientPage.visitPatient(hcxPatientName);
    patientConsultationPage.clickPatientDetails();
    patientPage.clickPatientUpdateDetails();
    patientInsurance.clickAddInsruanceDetails();
    patientInsurance.typePatientInsuranceDetail(
      firstInsuranceIdentifier,
      "subscriber_id",
      patientMemberId,
    );
    patientInsurance.typePatientInsuranceDetail(
      firstInsuranceIdentifier,
      "policy_id",
      patientPolicyId,
    );
    patientInsurance.selectPatientInsurerName(
      firstInsuranceIdentifier,
      patientInsurerName,
    );
    cy.clickSubmitButton("Save Details");
    cy.verifyNotification("Patient updated successfully");
    cy.closeNotification();
    // Navigate to Consultation View and capture dynamic consultation ID
    let consultationId: string;
    patientConsultationPage.clickViewConsultationButton();
    cy.url().then((url) => {
      const urlRegex =
        /facility\/([^/]+)\/patient\/([^/]+)\/consultation\/([^/]+)/;
      const match = url.match(urlRegex);
      if (match) {
        consultationId = match[3];
      }
    });
    // Intercept and mock the eligibility check response using captured consultationId
    cy.intercept("POST", "/api/hcx/check_eligibility", (req) => {
      req.reply({
        statusCode: 200,
        body: {
          api_call_id: "bfa228f0-cdfa-4426-bebe-26e996079dbb",
          correlation_id: "86ae030c-1b33-4e52-a6f1-7a74a48111eb",
          timestamp: Date.now(),
          consultation: consultationId,
          policy: patientPolicyId,
          outcome: "Complete",
          limit: 1,
        },
      });
    }).as("checkEligibility");
    // Raise a HCX Pre-auth
    patientConsultationPage.clickManagePatientButton();
    patientConsultationPage.clickClaimsButton();
    cy.verifyAndClickElement("#edit-insurance-policy", "Edit Insurance Policy");
    cy.clickCancelButton();
    hcxClaims.selectEligiblePolicy(patientInsurerName);
    hcxClaims.verifyPolicyEligibility();
    cy.verifyNotification("Checking Policy Eligibility");
    cy.closeNotification();
    // Confirm that the eligibility check displays as successful
    cy.wait("@checkEligibility").then((interception) => {
      const response = interception.response.body;
      expect(response.outcome).to.equal("Complete");
    });
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
