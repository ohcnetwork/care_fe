import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientNotes } from "@/pageObject/Patients/PatientNotes";
import { UserProfile } from "@/pageObject/Users/UserProfile";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generatePhoneNumber } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const patientEncounter = new PatientEncounter();
const facilityCreation = new FacilityCreation();
const patientNotes = new PatientNotes();
const userProfile = new UserProfile();

describe("Encounter Notes", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("doctor");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
    // Step 1: Navigate to encounter
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails();
  });

  it("should create multiple threads and verify messages", () => {
    const testData = {
      firstThreadTitle: `First Thread - ${generatePhoneNumber()}`,
      secondThreadTitle: `Second Thread - ${generatePhoneNumber()}`,
      firstThreadMessages: ["First thread message 1", "First thread message 2"],
      secondThreadMessages: [
        "Second thread message 1",
        "Second thread message 2. This message is intentionally longer",
      ],
    };

    // Step 2: Create and verify first thread
    patientNotes
      .openEncounterNotesTab()
      .clickNewThreadButton()
      .typeThreadTitle(testData.firstThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.firstThreadMessages)
      .verifyMessagesInChat(testData.firstThreadMessages);

    // Step 3: Create and verify second thread
    patientNotes
      .clickNewThreadButton()
      .typeThreadTitle(testData.secondThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.secondThreadMessages)
      .verifyMessagesNotExistInChat(testData.firstThreadMessages)
      .saveCurrentUrl();
  });

  it("should verify multi-user contribution support", () => {
    const testData = {
      firstUserThreadTitle: `First User Thread - ${generatePhoneNumber()}`,
      firstUserThreadMessages: ["First user thread message 1"],
      secondUserThreadMessages: ["Second user thread message 1"],
    };

    // First user creates thread and adds initial messages
    patientNotes
      .openEncounterNotesTab()
      .clickNewThreadButton()
      .typeThreadTitle(testData.firstUserThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.firstUserThreadMessages)
      .saveCurrentUrl();

    // Switch to second user and verify existing messages
    userProfile.openUserMenu().clickUserLogout();
    cy.loginByApi("nurse");
    patientNotes
      .navigateToSavedUrl()
      .verifyMessagesInChat(testData.firstUserThreadMessages)
      .addNewChatMessages(testData.secondUserThreadMessages)
      .verifyMessagesInChat(testData.secondUserThreadMessages);
  });
});
