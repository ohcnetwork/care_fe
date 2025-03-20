import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const patientEncounter = new PatientEncounter();
const facilityCreation = new FacilityCreation();

// Test Data
const testData = {
  firstThreadTitle: `First Thread - ${Date.now()}`,
  secondThreadTitle: `Second Thread - ${Date.now()}`,
  firstThreadMessages: [
    "First thread message 1",
    "First thread message 2. This is a longer message that contains more details and extends beyond a single line to properly test multi-line text handling in the chat system.",
  ],
  secondThreadMessages: [
    "Second thread message 1",
    "Second thread message 2. This message is intentionally longer to verify how the system handles extended chat messages. It includes additional text to ensure the UI does not truncate or wrap the message improperly.",
  ],
  thirdThreadMessages: [
    "Third thread message 1",
    "Third thread message 2. Adding more content here to simulate a real-world scenario where users might send lengthy messages containing important details, clarifications, or descriptions.",
  ],
  fourthThreadMessages: [
    "Fourth thread message 1",
    "Fourth thread message 2. This is another extended message to test how multi-line text is displayed. Ensuring the UI maintains readability and does not break formatting when handling larger inputs.",
  ],
};

describe("Encounter Notes", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    const role = Cypress.env("role") || "devdoctor";
    cy.loginByApi(role);
    cy.visit("/");
    facilityCreation.selectFacility("GHC Payyanur");
  });

  it("Should create multiple threads and ensure chats remain within their respective threads", () => {
    Cypress.env("role", "devdoctor");

    patientEncounter
      .navigateToEncounters()
      .openEncounterAndSaveId()
      .openEncounterNotesTab()
      .clickNewThreadButton()
      .typeThreadTitle(testData.firstThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.firstThreadMessages)
      .clickNewThreadButton()
      .typeThreadTitle(testData.secondThreadTitle)
      .clickCreateThreadButton()
      .addNewChatMessages(testData.secondThreadMessages);

    // ✅ Verify first thread contains only its messages
    patientEncounter
      .changeThread(testData.firstThreadTitle)
      .verifyMessagesInChat(testData.firstThreadMessages)
      .verifyMessagesNotExistInChat(testData.secondThreadMessages);

    // ✅ Verify second thread contains only its messages
    patientEncounter
      .changeThread(testData.secondThreadTitle)
      .verifyMessagesInChat(testData.secondThreadMessages)
      .verifyMessagesNotExistInChat(testData.firstThreadMessages);

    patientEncounter.logout();
  });

  it("Should allow different users to view and contribute to existing threads", () => {
    Cypress.env("role", "devnurse");

    const encounterId = Cypress.env("encounterId");
    assert.isDefined(encounterId, "Encounter ID should exist");

    patientEncounter
      .navigateToEncounters()
      .openEncounterById(encounterId)
      .openEncounterNotesTab();

    // ✅ Verify first thread messages and contribute
    patientEncounter
      .changeThread(testData.firstThreadTitle)
      .verifyMessagesInChat(testData.firstThreadMessages)
      .addNewChatMessages(testData.thirdThreadMessages)
      .verifyMessagesInChat(testData.thirdThreadMessages);

    // ✅ Verify second thread messages and contribute
    patientEncounter
      .changeThread(testData.secondThreadTitle)
      .verifyMessagesInChat(testData.secondThreadMessages)
      .addNewChatMessages(testData.fourthThreadMessages)
      .verifyMessagesInChat(testData.fourthThreadMessages);
  });
});
