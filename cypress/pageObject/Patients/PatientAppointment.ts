export interface TemplateData {
  templateName: string;
  validFrom: string;
  validTill: string;
  weeklySchedule?: string[];
  sessionTitle?: string;
  startTime?: string;
  endTime?: string;
  autoFillSlot?: boolean;
  numberOfSlots?: number;
  slotDuration?: number;
  patientsPerSlot?: number;
  remarks?: string;
}

export interface ExceptionData {
  reason: string;
  validFrom: string;
  validTill: string;
  fullDayUnavailable?: boolean;
}

export class PatientAppointment {
  private selectors = {
    mySchedules: "[data-cy=my-schedules]",
    createTemplateButton: "[data-cy=create-template-button]",
    scheduleTemplateName: "[data-cy=schedule-template-name]",
    templateValidFrom: "[data-cy=template-valid-from]",
    templateValidTill: "[data-cy=template-valid-till]",
    scheduleWeekdays: "[data-cy=schedule-weekdays]",
    templateSessionTitle: "[data-cy=template-session-title]",
    sessionStartTime: "[data-cy=session-start-time]",
    sessionEndTime: "[data-cy=session-end-time]",
    autoFillSlotDuration: "[data-cy=auto-fill-slot-duration]",
    numberOfSlots: "[data-cy=number-of-slots]",
    slotSizeInMinutes: "[data-cy=slot-size-in-minutes]",
    patientsPerSlot: "[data-cy=patients-per-slot]",
    templateRemarks: "[data-cy=template-remarks]",
    submitTemplate: "[data-cy=submit-template]",
    editTemplateName: "[data-cy=edit-template-name]",
    editTemplateValidFrom: "[data-cy=edit-template-valid-from]",
    editTemplateValidTill: "[data-cy=edit-template-valid-till]",
    exceptionTab: "[data-cy=exception-tab-button]",
    addExceptionButton: "[data-cy=add-exception-button]",
    exceptionReason: "[data-cy=exception-reason]",
    editTemplateSubmit: "[data-cy=edit-template-submit]",
    validFromExceptionDate: "[data-cy=valid-from-exception-date]",
    validTillExceptionDate: "[data-cy=valid-till-exception-date]",
    unavailableAllDayCheckbox: "[data-cy=unavailable-all-day-checkbox]",
    submitException: "[data-cy=submit-exception]",
  };

  clickMySchedules() {
    cy.verifyAndClickElement(this.selectors.mySchedules, "My Schedules");
    return this;
  }

  clickCreateTemplateButton() {
    cy.verifyAndClickElement(
      this.selectors.createTemplateButton,
      "Create Template",
    );
    return this;
  }

  fillScheduleTemplateName(name: string) {
    cy.typeIntoField(this.selectors.scheduleTemplateName, name, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillTemplateValidFrom(date: string) {
    cy.get(this.selectors.templateValidFrom).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  fillTemplateValidTill(date: string) {
    cy.get(this.selectors.templateValidTill).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  selectScheduleWeekdays(days: string[]) {
    days.forEach((day) => {
      cy.get(this.selectors.scheduleWeekdays).contains(day).click();
    });
    return this;
  }

  fillTemplateSessionTitle(title: string) {
    cy.typeIntoField(this.selectors.templateSessionTitle, title, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillSessionStartTime(time: string) {
    cy.typeIntoField(this.selectors.sessionStartTime, time, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillSessionEndTime(time: string) {
    cy.typeIntoField(this.selectors.sessionEndTime, time, {
      clearBeforeTyping: true,
    });
    return this;
  }

  toggleAutoFillSlotDuration(enable: boolean) {
    cy.get(this.selectors.autoFillSlotDuration).then(($el) => {
      if ($el.prop("checked") !== enable) {
        cy.wrap($el).click();
      }
    });
    return this;
  }

  fillNumberOfSlots(slots: number) {
    cy.typeIntoField(this.selectors.numberOfSlots, slots.toString(), {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillSlotSizeInMinutes(minutes: number) {
    cy.typeIntoField(this.selectors.slotSizeInMinutes, minutes.toString(), {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillPatientsPerSlot(patients: number) {
    cy.typeIntoField(this.selectors.patientsPerSlot, patients.toString(), {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillTemplateRemarks(remarks: string) {
    cy.typeIntoField(this.selectors.templateRemarks, remarks, {
      clearBeforeTyping: true,
    });
    return this;
  }

  submitTemplate() {
    cy.clickSubmitButton("Save");
    return this;
  }

  interceptTemplateCreation() {
    cy.intercept("POST", "/api/v1/facility/*/schedule/").as("createTemplate");
    return this;
  }

  verifyTemplateCreationAPICall() {
    cy.wait("@createTemplate").then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
    });
    return this;
  }

  interceptTemplateUpdation() {
    cy.intercept("POST", "/api/v1/facility/*/schedule/").as("updateTemplate");
    return this;
  }

  verifyTemplateUpdationAPICall() {
    cy.wait("@createTemplate").then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
    });
    return this;
  }

  clickUpdateTemplateIcon() {
    cy.get("[data-cy=update-template-icon]").click();
    return this;
  }

  fillTemplateForm(data: TemplateData) {
    this.interceptTemplateCreation();
    this.fillScheduleTemplateName(data.templateName);
    this.fillTemplateValidFrom(data.validFrom);
    this.fillTemplateValidTill(data.validTill);
    if (data.weeklySchedule) this.selectScheduleWeekdays(data.weeklySchedule);
    if (data.sessionTitle) this.fillTemplateSessionTitle(data.sessionTitle);
    if (data.startTime) this.fillSessionStartTime(data.startTime);
    if (data.endTime) this.fillSessionEndTime(data.endTime);
    this.toggleAutoFillSlotDuration(data.autoFillSlot ?? true);
    if (data.numberOfSlots) this.fillNumberOfSlots(data.numberOfSlots);
    if (data.slotDuration) this.fillSlotSizeInMinutes(data.slotDuration);
    if (data.patientsPerSlot) this.fillPatientsPerSlot(data.patientsPerSlot);
    if (data.remarks) this.fillTemplateRemarks(data.remarks);
    this.submitTemplate();
    this.verifyTemplateCreationAPICall();
    return this;
  }

  fillEditTemplateName(name: string) {
    cy.typeIntoField(this.selectors.editTemplateName, name, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillEditTemplateValidFrom(date: string) {
    cy.get(this.selectors.editTemplateValidFrom).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  fillEditTemplateValidTill(date: string) {
    cy.get(this.selectors.editTemplateValidTill).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  submitEditTemplate() {
    cy.get(this.selectors.editTemplateSubmit).click();
    return this;
  }

  fillEditForm(data: TemplateData) {
    this.interceptTemplateUpdation();
    this.fillEditTemplateName(data.templateName);
    this.fillEditTemplateValidFrom(data.validFrom);
    this.fillEditTemplateValidTill(data.validTill);
    this.submitEditTemplate();
    this.verifyTemplateUpdationAPICall();
    return this;
  }

  fillExceptionReason(reason: string) {
    cy.typeIntoField(this.selectors.exceptionReason, reason, {
      clearBeforeTyping: true,
    });
    return this;
  }

  fillValidFromExceptionDate(date: string) {
    cy.get(this.selectors.validFromExceptionDate).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  fillValidTillExceptionDate(date: string) {
    cy.get(this.selectors.validTillExceptionDate).click();
    cy.get(`[aria-label="${date}"]`).click();
    return this;
  }

  toggleUnavailableAllDay(enable: boolean) {
    cy.get(this.selectors.unavailableAllDayCheckbox).then(($el) => {
      if ($el.prop("checked") !== enable) {
        cy.wrap($el).click();
      }
    });
    return this;
  }

  submitException() {
    cy.get(this.selectors.submitException).click();
    return this;
  }

  interceptExceptionCreation() {
    cy.intercept("POST", "/api/v1/facility/*/exceptions/").as(
      "createException",
    );
    return this;
  }

  verifyExceptionCreationAPICall() {
    cy.wait("@createException").then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
    });
    return this;
  }

  clickExceptionTab() {
    cy.verifyAndClickElement(this.selectors.exceptionTab, "Exception");
    return this;
  }

  clickAddExceptionButton() {
    cy.verifyAndClickElement(
      this.selectors.addExceptionButton,
      "Add Exception",
    );
    return this;
  }

  fillExceptionForm(data: ExceptionData) {
    this.interceptExceptionCreation();
    this.fillExceptionReason(data.reason);
    this.fillValidFromExceptionDate(data.validFrom);
    this.fillValidTillExceptionDate(data.validTill);
    if (data.fullDayUnavailable) {
      this.toggleUnavailableAllDay(true);
    } else {
      this.toggleUnavailableAllDay(false);
    }
    this.submitException();
    this.verifyExceptionCreationAPICall();
    return this;
  }
}
