interface Session {
  name: string;
  start: string;
  end: string;
  slots: number;
  tokens: number;
  remarks: string;
  autoFill?: boolean;
}

export class AvailabilitySchedule {
  templateName: string;

  constructor(templateName: string) {
    this.templateName = templateName;
  }

  navigateToSchedulePage() {
    cy.visit("/");

    cy.contains("My Schedules", { timeout: 10000 })
      .should("be.visible")
      .click();
    return this;
  }

  clickCreateTemplate() {
    cy.contains("Create Template", { timeout: 10000 })
      .should("be.visible")
      .click();
    return this;
  }

  fillTemplateName() {
    cy.get('input[placeholder="Regular OP Day"]')
      .clear()
      .type(this.templateName);
    return this;
  }

  // Inside your AvailabilitySchedule class

  selectValidDates() {
    // Valid From
    cy.contains("Valid From").parent().find("button").click();
    cy.get('[role="gridcell"]:not([data-disabled="true"])').should(
      "have.length.at.least",
      2,
    );
    cy.get('[role="gridcell"]:not([data-disabled="true"])')
      .eq(1)
      .invoke("text")
      .as("createdDate");
    cy.get('[role="gridcell"]:not([data-disabled="true"])')
      .eq(1)
      .find("button")
      .click();
    cy.get('[role="gridcell"]').should("not.exist");

    // Valid Till
    cy.contains("Valid Till")
      .parent()
      .find("button")
      .should("be.visible")
      .click();
    cy.get('[role="gridcell"]').should("be.visible");
    cy.get('[role="gridcell"]:not([data-disabled="true"])').should(
      "have.length.at.least",
      3,
    );
    cy.get('[role="gridcell"]:not([data-disabled="true"])')
      .eq(2)
      .find("button")
      .click();

    return this;
  }

  selectAllWeekdays() {
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
      cy.contains("button", day).click();
    });
    return this;
  }

  fillSession(index: number, session: Session) {
    if (index !== 0) {
      cy.get('input[placeholder="IP Rounds"]')
        .last()
        .clear()
        .type(session.name);
    } else {
      cy.get('input[placeholder="IP Rounds"]').clear().type(session.name);
    }

    cy.get(`input[name="availabilities.${index}.start_time"]`).type(
      session.start,
    );
    cy.get(`input[name="availabilities.${index}.end_time"]`).type(session.end);

    if (session.autoFill) {
      cy.contains("Auto-fill slot duration").click();
      cy.get(`input[name="availabilities.${index}.num_of_slots"]`)
        .clear()
        .type(`${session.slots}`);
    } else {
      cy.get(`input[name="availabilities.${index}.slot_size_in_minutes"]`)
        .clear()
        .type(`${session.slots}`);
    }

    cy.get(`input[name="availabilities.${index}.tokens_per_slot"]`)
      .clear()
      .type(`${session.tokens}`);
    cy.get('textarea[placeholder="Enter remarks"]')
      .eq(index)
      .type(session.remarks);

    return this;
  }

  addSession() {
    cy.contains("Add another session").click();
    return this;
  }

  save() {
    cy.contains("Save").click();
    return this;
  }

  verifySessionOnAppointmentPage(
    practitionerName: string,
    sessions: Session[],
  ) {
    // Step 1: Go to Book Appointment page

    cy.visit(`/facility`);
    cy.contains("p", "View facility details")
      .parents("div.flex-1.min-w-0")
      .should("exist")
      .click();

    cy.contains("Encounters", { timeout: 10000 }).click();

    // Step 2: Select the department (replace with actual value if needed)
    cy.get('[data-cy="encounter-list-cards"]') // Get all encounter cards
      .first() // Pick the first one
      .find("button") // Find all buttons inside it
      .contains("View Patient") // Filter for the "View Patient" one
      .click(); // Click it

    cy.contains("Schedule Appointment").click();
    cy.contains("label", "Select Practitioner")
      .parent()
      .find('button[data-slot="popover-trigger"]')
      .click();

    // Step 3: Select from the list
    cy.contains("Vihaan Radhakrishnan").click();

    const totalPatientSlots = sessions.reduce(
      (sum, s) => sum + s.slots * s.tokens,
      0,
    );

    cy.get('button:contains("left")', { timeout: 10000 }).should("be.visible");
    cy.get("span")
      .contains(`${totalPatientSlots} left`)
      .parents("button:not([disabled])")
      .should("be.visible")
      .click();

    sessions.forEach((session) => {
      const expectedTimeText = `${session.start}\n${session.tokens} left`;
      cy.contains(".text-center.py-2.rounded-lg", expectedTimeText).should(
        "be.visible",
      );
    });

    return this;
  }
}
