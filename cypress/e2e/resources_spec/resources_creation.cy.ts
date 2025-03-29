import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { ResourcesCreation } from "@/pageObject/resources/ResourcesCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();
const resourceCreation = new ResourcesCreation();

describe("Resources Management", () => {
  const testData = {
    facility: "DH Aluva",
    sourceFacility: "GHC Payyanur",
    status: "Pending",
    category: "Medicines",
    resourceTitle: "TestCypress",
    reasonOfRequest: "Reason Testing",
  };
  const updatedTestData = {
    facility: "DH Eloor",
    sourceFacility: "GHC Payyanur",
    status: "Pending",
    category: "Comfort Devices",
    resourceTitle: "Updated Resource test title",
    reasonOfRequest: "Updated Reason Testing",
  };

  beforeEach(() => {
    cy.loginByApi("devnurse3");
    cy.visit("/");
  });

  it("Create a new resource request and verify it on Resources Board and Patient Detail Page", () => {
    facilityCreation.selectFacility(testData.sourceFacility);
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails
      .clickResourcesTab()
      .saveCurrentUrl()
      .clickCreateRequestButton();

    resourceCreation
      .selectFacility(testData.facility)
      .selectStatus(testData.status)
      .selectCategory(testData.category)
      .enterResourceTitle(testData.resourceTitle)
      .enterReasonOfRequest(testData.reasonOfRequest)
      .clickFillMyDetails()
      .interceptResourceCreationRequest()
      .clickSubmitButton()
      .verifyResourceCreationApiCall()
      .assertResourceCreateSuccess();

    patientDetails.navigateToSavedUrl();

    cy.get("[data-cy='resource-requests-table']").should("be.visible");
    cy.verifyContentPresence("[data-cy='resource-requests-table-row-0']", [
      testData.category,
      testData.resourceTitle,
      testData.status,
    ]);

    cy.verifyAndClickElement('[data-sidebar="content"]', "Resource");
    cy.get("[data-cy='tab-outgoing']").click();
    cy.get("[data-cy='tab-outgoing']").should(
      "have.attr",
      "data-state",
      "active",
    );
    cy.get("[data-cy='tab-pending']").click();
    cy.get("[data-cy='tab-pending']").should(
      "have.attr",
      "data-state",
      "active",
    );
    resourceCreation.searchResource(testData.resourceTitle);
    cy.verifyContentPresence('[data-cy="resource-card-0"]', [
      testData.resourceTitle,
      testData.reasonOfRequest,
      testData.category,
      testData.sourceFacility,
      testData.facility,
      "View Details",
    ]);

    patientDetails.navigateToSavedUrl();
    cy.get("[data-cy='resource-requests-table-row-0']").within(() => {
      cy.contains("View").click();
    });
    cy.verifyAndClickElement(
      '[data-cy="update-status-button"]',
      "Update Status",
    );
    resourceCreation
      .selectFacility(updatedTestData.facility)
      .selectStatus(updatedTestData.status)
      .selectCategory(updatedTestData.category)
      .selectAssignedUser("devnurse3")
      .enterResourceTitle(updatedTestData.resourceTitle)
      .enterReasonOfRequest(updatedTestData.reasonOfRequest)
      .interceptResourceUpdateRequest()
      .clickSubmitButton()
      .verifyResourceUpdationApiCall()
      .assertResourceUpdateSuccess();
    patientDetails.navigateToSavedUrl();

    cy.get("[data-cy='resource-requests-table']").should("be.visible");
    cy.verifyContentPresence("[data-cy='resource-requests-table']", [
      updatedTestData.category,
      updatedTestData.resourceTitle,
      updatedTestData.status,
    ]);

    cy.verifyAndClickElement('[data-sidebar="content"]', "Resource");
    cy.get("[data-cy='tab-outgoing']").click();
    cy.get("[data-cy='tab-pending']").click();
    resourceCreation.searchResource(updatedTestData.resourceTitle);
    cy.verifyContentPresence('[data-cy="resource-card-0"]', [
      updatedTestData.resourceTitle,
      updatedTestData.reasonOfRequest,
      updatedTestData.category,
      updatedTestData.sourceFacility,
      updatedTestData.facility,
      "View Details",
    ]);
  });
});
