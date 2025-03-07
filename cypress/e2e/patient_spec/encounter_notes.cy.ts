import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const patientEncounter = new PatientEncounter();
const facilityCreation = new FacilityCreation();

describe("Encounter Notes", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor");
    cy.visit("/");
  });

  it("Create Encounter Notes", () => {
    const firstThreadTitle = "First Thread - " + Date.now();
    const secondThreadTitle = "Second Thread - " + Date.now();

    const singleLineMessage = "Single line message";
    const multiLineMessage =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

    facilityCreation.selectFacility("GHC payyanur");
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .openEncounterNotesTab()
      .clickNewThreadButton()
      .typeThreadTitle(firstThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(singleLineMessage, multiLineMessage)
      .clickNewThreadButton()
      .typeThreadTitle(secondThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(singleLineMessage, multiLineMessage)
      .changeThread(firstThreadTitle);
  });
});
