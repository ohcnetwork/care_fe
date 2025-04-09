// import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
// import { PatientAppointment } from "@/pageObject/Patients/PatientAppointment";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
// const patientAppointment = new PatientAppointment();

describe("User Schedule and Patient Appointment", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("");
    cy.visit("/");
  });

  it("Create and update a new User Schedule template", () => {
    facilityCreation.selectFacility("GHC Payyanur");
  });
});

// Test for Template Creation and Updation
// Test for Exception
// Test for Patient Appointments
