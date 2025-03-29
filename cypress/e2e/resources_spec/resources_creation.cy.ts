import { PatientDetails } from "@/pageObject/Patients/PatientDetails";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  ResourceRequestFormData,
  ResourcesCreation,
} from "@/pageObject/resources/ResourcesCreation";

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
    title: "TestCypress",
    reason: "Reason Testing",
    assignedUser: "devnurse3",
  };
  const updatedTestData = {
    facility: "DH Eloor",
    sourceFacility: "GHC Payyanur",
    status: "Pending",
    category: "Comfort Devices",
    title: "Updated Resource test title",
    reason: "Updated Reason Testing",
    assignedUser: "devnurse3",
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
      .fillResourceRequestDetails(testData as ResourceRequestFormData)
      .clickFillMyDetails()
      .interceptResourceCreationRequest()
      .clickSubmitButton()
      .verifyResourceCreationApiCall()
      .assertResourceCreateSuccess();

    patientDetails.navigateToSavedUrl();

    resourceCreation.verifyResourceRequestInPatientPage(testData);

    resourceCreation.clickSidebarResource();
    resourceCreation
      .clickFilterTab("outgoing")
      .clickFilterTab("pending")
      .searchResource(testData.title);

    resourceCreation
      .verifyResourceCardContent(testData)
      .clickViewDetailsButton();

    resourceCreation.clickUpdateStatusButton();
    resourceCreation
      .fillResourceRequestDetails(updatedTestData as ResourceRequestFormData)
      .selectAssignedUser(updatedTestData.assignedUser)
      .interceptResourceUpdateRequest()
      .clickSubmitButton()
      .verifyResourceUpdationApiCall()
      .assertResourceUpdateSuccess();

    patientDetails.navigateToSavedUrl();

    resourceCreation.verifyResourceRequestInPatientPage(updatedTestData);

    resourceCreation.clickSidebarResource();

    resourceCreation
      .clickFilterTab("outgoing")
      .clickFilterTab("pending")
      .searchResource(updatedTestData.title);
    resourceCreation.verifyResourceCardContent(updatedTestData);
  });
});
