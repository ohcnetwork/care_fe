import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientNotes } from "@/pageObject/Patients/PatientNotes";
import { UserProfile } from "@/pageObject/Users/UserProfile";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const patientEncounter = new PatientEncounter();
const facilityCreation = new FacilityCreation();
const patientNotes = new PatientNotes();
const userProfile = new UserProfile();

// Test Data
const testData = {
  firstThreadTitle: `First Thread - ${Date.now()}`,
  secondThreadTitle: `Second Thread - ${Date.now()}`,
  firstThreadMessages: [
    "First thread message 1",
    "First thread message 2. This is a longer message that contains more details",
  ],
  secondThreadMessages: [
    "Second thread message 1",
    "Second thread message 2. This message is intentionally longer to verify how the system handles extended chat messages.",
  ],
  thirdThreadMessages: ["Third thread message 1"],
};

describe("Encounter Notes", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor2");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  it("Create multiple threads and verify the messages are multi-user contribution supported", () => {
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
    patientNotes
      .openEncounterNotesTab()
      .clickNewThreadButton()
      .typeThreadTitle(testData.firstThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.firstThreadMessages)
      .verifyMessagesInChat(testData.firstThreadMessages)
      .clickNewThreadButton()
      .typeThreadTitle(testData.secondThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.secondThreadMessages)
      .verifyMessagesNotExistInChat(testData.firstThreadMessages)
      .saveCurrentUrl();

    // Login as a new user and verify the thread
    userProfile.openUserMenu().clickUserLogout();
    // Login as a new user and verify the thread
    cy.loginByApi("devdoctor4");
    patientNotes
      .navigateToSavedUrl()
      .verifyMessagesInChat(testData.secondThreadMessages)
      .addNewChatMessages(testData.thirdThreadMessages)
      .verifyMessagesInChat(testData.thirdThreadMessages);
  });
});
