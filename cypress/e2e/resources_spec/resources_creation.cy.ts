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
    assignedUser: "devnurse2",
  };

  beforeEach(() => {
    cy.loginByApi("devnurse4");
    cy.visit("/");
  });

  it("Create a new resource request and verify it on Resources Board and Patient Detail Page", () => {
    facilityCreation.selectFacility(testData.sourceFacility);
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickPatientDetailsButton();

    patientDetails
      .clickResourcesTab()
      .saveCurrentUrl()
      .clickCreateRequestButton();

    resourceCreation
      .fillResourceRequestForm(testData as ResourceRequestFormData)
      .interceptCreateRequest()
      .submitForm()
      .verifyCreateRequest()
      .assertCreationSuccess();

    patientDetails.navigateToSavedUrl();

    resourceCreation
      .verifyResourceInPatientPage(testData)
      .navigateToResources()
      .applyFilter("outgoing")
      .applyFilter("pending")
      .searchResource(testData.title)
      .verifyResourceCardDetails(testData)
      .openResourceDetails()
      .updateResourceStatus()
      .fillResourceRequestForm(updatedTestData as ResourceRequestFormData)
      .selectAssignedUser(updatedTestData.assignedUser)
      .interceptUpdateRequest()
      .submitForm()
      .verifyUpdateRequest()
      .assertUpdateSuccess();

    patientDetails.navigateToSavedUrl();

    resourceCreation
      .verifyResourceInPatientPage(updatedTestData)
      .navigateToResources()
      .applyFilter("outgoing")
      .applyFilter("pending")
      .searchResource(updatedTestData.title)
      .verifyResourceCardDetails(updatedTestData);
  });
});
