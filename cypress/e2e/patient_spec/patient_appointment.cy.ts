import { PatientAppointment } from "@/pageObject/Patients/PatientAppointment";
import {
  ExceptionData,
  TemplateData,
} from "@/pageObject/Patients/PatientAppointment";
// import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientAppointment = new PatientAppointment();

describe("User Schedule and Patient Appointment", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("devdoctor4");
    cy.visit("/");
  });

  it("Create and update a new User Schedule template", () => {
    // Test data for template creation
    const formData: TemplateData = {
      templateName: "Test-Template",
      validFrom: "2025-08-01",
      validTill: "2025-08-31",
      weeklySchedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      sessionTitle: "Test-Session",
      startTime: "08:00",
      endTime: "10:00",
      autoFillSlot: true,
      numberOfSlots: 2,
      patientsPerSlot: 2,
    };

    // Test data for template creation
    const updateData: TemplateData = {
      templateName: "Test-Template-updated",
      validFrom: "2025-09-01",
      validTill: "2025-09-31",
    };

    facilityCreation.selectFacility("GHC Payyanur");
    patientAppointment
      .clickMySchedules()
      .clickCreateTemplateButton()
      .fillTemplateForm(formData)
      .clickUpdateTemplateIcon()
      .fillEditForm(updateData);
  });
  it("Create a new exception", () => {
    // Test data for exception creation
    const exceptionData: ExceptionData = {
      reason: "Holiday",
      validFrom: "2025-08-15",
      validTill: "2025-08-15",
      fullDayUnavailable: true,
    };

    facilityCreation.selectFacility("GHC Payyanur");
    patientAppointment
      .clickExceptionTab()
      .clickAddExceptionButton()
      .clickMySchedules()
      .fillExceptionForm(exceptionData);
  });
});

// Test for Patient Appointments
