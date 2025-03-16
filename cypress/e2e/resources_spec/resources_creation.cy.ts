import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { ResourcesCreation } from "@/pageObject/resources/ResourcesCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientDetails = new PatientDetails();
const resourceCreation = new ResourcesCreation();

describe("Resources Management", () => {
  const facility = "DH Aluva";
  const status = "Pending";
  const category = "Medicines";
  const resourceTitle = "TestCypress";
  const reasonOfRequest = "Reason Testing";

  beforeEach(() => {
    cy.loginByApi("devnurse");
    cy.visit("/");
  });

  it("Create a new resource", () => {
    facilityCreation.selectFacility("GHC payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails.clickResourcesTab().clickCreateRequestButton();

    resourceCreation
      .selectFacility(facility)
      .selectStatus(status)
      .selectCategory(category)
      .enterResourceTitle(resourceTitle)
      .enterReasonOfRequest(reasonOfRequest)
      .clickFillMyDetails()
      .clickSubmitButton()
      .assertResourceCreateSuccess();
  });

  it("Verify created resource", () => {
    facilityCreation.selectFacility("GHC payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails.clickResourcesTab();

    cy.get("[data-cy='resource-requests-table']").should("be.visible");
    cy.get("[data-cy='resource-type-0']").should("contain.text", category);
    cy.get("[data-cy='title-0']").should("contain.text", resourceTitle);
    cy.get("[data-cy='status-0']").should("contain.text", status);
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
    // cy.get(`[data-cy="resource-card-0}"]`, { timeout: 1000 }).should(
    //   "be.visible",
    // );
    // cy.get(`[data-cy="resource-title-0"]`).should(
    //   "contain.text",
    //   resourceTitle,
    // );
    // cy.get(`[data-cy="resource-reason-0"]`).should(
    //   "contain.text",
    //   reasonOfRequest,
    // );
    // cy.get(`[data-cy="resource-category-0"]`).should("contain.text", category);
  });
});
