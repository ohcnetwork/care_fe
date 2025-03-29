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

  beforeEach(() => {
    cy.loginByApi("devnurse4");
    cy.visit("/");
  });

  it("Create a new resource", () => {
    facilityCreation.selectFacility("GHC Payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails.clickResourcesTab().clickCreateRequestButton();

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
  });

  it("Verify created resource", () => {
    facilityCreation.selectFacility("GHC Payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails.clickResourcesTab();

    cy.get("[data-cy='resource-requests-table']").should("be.visible");
    cy.verifyContentPresence("[data-cy='resource-requests-table']", [
      testData.category,
      testData.resourceTitle,
      testData.status,
    ]);

    cy.get('[data-sidebar="content"]').contains("Resource").click();
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
    cy.verifyContentPresence('[data-cy="resource-card-0"]', [
      testData.resourceTitle,
      testData.reasonOfRequest,
      testData.category,
      "GHC Payyanur",
      testData.facility,
      "View Details",
    ]);
  });
});
