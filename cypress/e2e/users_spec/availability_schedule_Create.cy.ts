import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { AvailabilitySchedule } from "@/pageObject/schedules/AvailabilitySchedule";

const facilityCreation = new FacilityCreation();

describe("Doctor Availability Scheduling", () => {
  const schedule = new AvailabilitySchedule("Test schedule");
  const morningSession = {
    name: "Morning Session",
    start: "08:00",
    end: "10:00",
    slots: 20,
    tokens: 2,
    remarks: "Morning Remarks",
    autoFill: true,
  };
  const eveningSession = {
    name: "Evening Session",
    start: "13:00",
    end: "16:00",
    slots: 20,
    tokens: 3,
    remarks: "Evening remarks",
  };

  const allSessions = [morningSession, eveningSession];

  beforeEach(() => {
    cy.loginByApi("doctor");
    cy.visit("/", { timeout: 120000 });
  });

  it("creates availability with multiple sessions and all fields", () => {
    facilityCreation.selectFirstRandomFacility();
    schedule
      .navigateToSchedulePage()
      .clickCreateTemplate()
      .fillTemplateName()
      .selectValidDates()
      .selectAllWeekdays()
      .fillSession(0, morningSession)
      .addSession()
      .fillSession(1, eveningSession)
      .save()
      .verifySessionOnAppointmentPage("Vihaan Radhakrishnan", allSessions);
  });
});
