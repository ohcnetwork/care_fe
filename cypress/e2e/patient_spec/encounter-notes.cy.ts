import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();

describe("Encounter Notes - Threads, Messages, and Notes", () => {
  beforeEach(() => {
    cy.loginByApi("devdoctor"); // logging in as doctor
    cy.visit("/");
    facilityCreation.selectFacility("GHC Trikaripur");
  });

  it("create multiple threads and add messages", () => {
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .openNotesTab()
      

    // first Thread
    cy.contains("button", "New Thread").click();
    cy.get("input[placeholder='Enter discussion title...']").type("Test Discussion final");
    cy.contains("button", "Create").click();
    cy.get("form").within(() => {
      cy.get("textarea").type("This is a test message fianl!");
      cy.get('button[type="submit"]').click();
    });

    

    // second thread
    cy.contains("button", "New Thread").click();
    cy.get("input[placeholder='Enter discussion title...']").type("Test Discussion 100");
    cy.contains("button", "Create").click();
    cy.get("form").within(() => {
      cy.get("textarea").type("This is a test message 100!");
      cy.get('button[type="submit"]').click();
    });

      cy.intercept("POST", "https://careapi.ohc.network/api/v1/auth/logout/").as("logoutRequest");

    

    // logging as nurse
    cy.loginByApi("devnurse");
    cy.visit("/");
    facilityCreation.selectFacility("GHC Trikaripur");
    patientEncounter.navigateToEncounters().openFirstEncounterDetails().openNotesTab();
  });

  it("create a new note in the Notes tab", () => {
    patientEncounter
      .navigateToEncounters()
      .openFirstEncounterDetails()
      .openNotesTab()

    // first thread in nurse login
    cy.contains("button", "New Thread").click();
    cy.get("input[placeholder='Enter discussion title...']").type("Test Discussion 200");
    cy.contains("button", "Create").click();
    cy.get("form").within(() => {
      cy.get("textarea").type("This is a test message 200!");
      cy.get('button[type="submit"]').click();
    });

    

    // second thread in nurse login
    cy.contains("button", "New Thread").click();
    cy.get("input[placeholder='Enter discussion title...']").type("Test Discussion 300");
    cy.contains("button", "Create").click();
    cy.get("form").within(() => {
      cy.get("textarea").type("This is a test message 300!");
      cy.get('button[type="submit"]').click();
    });
  });
});
