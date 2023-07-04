class ShiftingPage {
  advancedFilterButton() {
    return cy.get("#advanced-filter");
  }

  originFacilityInput() {
    return cy.get("input[name='origin_facility']");
  }

  assignedFacilityInput() {
    return cy.get("input[name='assigned_facility']");
  }

  assignedToInput() {
    return cy.get("#assigned-to");
  }

  orderingInput() {
    return cy.get("#ordering");
  }

  emergencyInput() {
    return cy.get("#emergency");
  }

  isUpShiftInput() {
    return cy.get("#is-up-shift");
  }

  diseaseStatusInput() {
    return cy.get("#disease-status");
  }

  isAntenatalInput() {
    return cy.get("#is-antenatal");
  }

  breathlessnessLevelInput() {
    return cy.get("#breathlessness-level");
  }

  phoneNumberInput() {
    return cy.get("#patient_phone_number");
  }

  createdDateStartInput() {
    return cy.get("input[name='created_date_start']");
  }

  modifiedDateStartInput() {
    return cy.get("input[name='modified_date_start']");
  }

  applyFilterButton() {
    return cy.get("#apply-filter");
  }

  facilityAssignedBadge() {
    return cy.get("[data-testid='Facility assigned']");
  }

  currentFacilityBadge() {
    return cy.get("[data-testid='Current facility']");
  }

  diseaseStatusBadge() {
    return cy.get("[data-testid='Disease status']");
  }

  orderingBadge() {
    return cy.get("[data-testid='Ordering']");
  }

  breathlessnessLevelBadge() {
    return cy.get("[data-testid='Breathlessness level']");
  }

  phoneNumberBadge() {
    return cy.get("[data-testid='Phone no.']");
  }

  createdAfterBadge() {
    return cy.get("[data-testid='Created after']");
  }

  createdBeforeBadge() {
    return cy.get("[data-testid='Created before']");
  }

  modifiedAfterBadge() {
    return cy.get("[data-testid='Modified after']");
  }

  modifiedBeforeBadge() {
    return cy.get("[data-testid='Modified before']");
  }

  filterByFacility(
    origin_facility: string,
    assigned_facility: string,
    assigned_to: string
  ) {
    this.originFacilityInput().click().type(origin_facility);
    cy.get("[role='option']").contains(origin_facility).click();

    this.assignedFacilityInput().click().type(assigned_facility);
    cy.get("[role='option']").contains(assigned_facility).click();

    this.assignedToInput().click().type(assigned_to);
    cy.get("[role='option']").contains(assigned_to).click();

    this.applyFilterButton().click();
  }

  filterByOtherCategory(
    ordering: string,
    emergency: string,
    is_up_shift: string,
    disease_status: string,
    is_antenatal: string,
    breathlessness_level: string,
    patient_phone_number: string
  ) {
    this.orderingInput().click();
    cy.get("[role='option']").contains(ordering).click();

    this.emergencyInput().click();
    cy.get("[role='option']").contains(emergency).click();

    this.isUpShiftInput().click();
    cy.get("[role='option']").contains(is_up_shift).click();

    this.diseaseStatusInput().click();
    cy.get("[role='option']").contains(disease_status).click();

    this.isAntenatalInput().click();
    cy.get("[role='option']").contains(is_antenatal).click();

    this.breathlessnessLevelInput().click();
    cy.get("[role='option']").contains(breathlessness_level).click();

    this.phoneNumberInput().click().type(patient_phone_number);

    this.applyFilterButton().click();
  }

  filterByDate(
    created_date_start: string,
    created_date_end: string,
    modified_date_start: string,
    modified_date_end: string
  ) {
    this.createdDateStartInput().click();
    cy.get("[id^='headlessui-popover-panel-'] .care-l-angle-left-b")
      .eq(0)
      .closest("button")
      .click();
    cy.get(created_date_start).click();
    cy.get(created_date_end).click();

    this.modifiedDateStartInput().click();
    cy.get("[id^='headlessui-popover-panel-'] .care-l-angle-left-b")
      .eq(0)
      .closest("button")
      .click();
    cy.get(modified_date_start).click();
    cy.get(modified_date_end).click();

    this.applyFilterButton().click();
  }
}

export default ShiftingPage;
