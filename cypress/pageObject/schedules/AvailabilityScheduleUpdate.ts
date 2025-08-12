export class AvailabilityScheduleUpdate {
  visitSchedulePage() {
    cy.loginByApi("doctor");
    cy.visit("/");
    cy.contains("p", "View facility details")
      .parents("div.flex-1.min-w-0")
      .should("exist")
      .click();
    cy.contains("My Schedules", { timeout: 10000 })
      .should("be.visible")
      .click();
    return this;
  }

  openScheduleByName(scheduleName: string) {
    cy.contains(scheduleName)
      .parents(".rounded-lg.bg-white")
      .find('button[data-slot="button"]')
      .should("be.visible")
      .click();
    cy.contains("Edit Schedule Template").should("be.visible");
    return this;
  }

  addNewSession(
    sessionName: string,
    startTime: string,
    endTime: string,
    slot: string,
    tokens: string,
    day: string,
    remarks: string,
  ) {
    cy.contains("Add another session")
      .scrollIntoView()
      .should("be.visible")
      .click();

    cy.get('input[placeholder="IP Rounds"]').last().clear().type(sessionName);

    cy.get('input[name="slot_size_in_minutes"]').last().clear().type(slot);

    cy.get('input[name="tokens_per_slot"]').last().clear().type(tokens);

    cy.get("button").contains(day[0]).click(); // assumes "M" for Monday etc.

    cy.get('textarea[placeholder="Enter remarks"]').last().type(remarks);

    return this;
  }
  saveSchedule() {
    cy.get("form.space-y-4").clickSubmitButton("Create");
    return this;
  }

  fillNonOverlappingTimes() {
    let baseHour = 1;

    if (baseHour >= 17) baseHour = 1;

    const startHour = baseHour;
    const endHour = baseHour + 1;

    const format = (hour: number) => hour.toString().padStart(2, "0") + ":00";

    cy.get('input[name="start_time"]').clear().type(format(startHour));
    cy.get('input[name="end_time"]').clear().type(format(endHour));
    return this;
  }
}
