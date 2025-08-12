import { AvailabilityScheduleUpdate } from "@/pageObject/schedules/AvailabilityScheduleUpdate";

describe("Doctor Availability Scheduling", () => {
  const scheduleUpdate = new AvailabilityScheduleUpdate();

  before(() => {
    scheduleUpdate.visitSchedulePage();
  });

  it("updates existing session", () => {
    scheduleUpdate
      .openScheduleByName("Test schedule")
      .addNewSession(
        "Evening Session",
        "14:00",
        "16:00",
        "60",
        "3",
        "Mon",
        "Evening remarks",
      )
      .fillNonOverlappingTimes()
      .saveSchedule();
  });
});
