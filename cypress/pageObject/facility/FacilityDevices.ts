export class FacilityDevices {
  navigateToFacilityDevices() {
    cy.verifyAndClickElement('[data-cy="nav-devices"]', "Devices");
    return this;
  }

  clickAddDevice() {
    cy.verifyAndClickElement('[data-cy="add-device-button"]', "Add Device");
    return this;
  }

  fillDeviceForm({
    registeredName,
    userFriendlyName,
    status,
    availabilityStatus,
    identifier,
    manufacturer,
    manufactureDate,
    expirationDate,
    lotNumber,
    serialNumber,
    modelNumber,
    partNumber,
  }: {
    registeredName?: string;
    userFriendlyName?: string;
    status?: string;
    availabilityStatus?: string;
    identifier?: string;
    manufacturer?: string;
    manufactureDate?: string;
    expirationDate?: string;
    lotNumber?: string;
    serialNumber?: string;
    modelNumber?: string;
    partNumber?: string;
  }) {
    if (registeredName) {
      cy.typeIntoField('[data-cy="registered-name-input"]', registeredName, {
        clearBeforeTyping: true,
      });
    }

    if (userFriendlyName) {
      cy.typeIntoField(
        '[data-cy="user-friendly-name-input"]',
        userFriendlyName,
      );
    }

    if (status) {
      cy.clickAndSelectOption('[data-cy="device-status-select"]', status);
    }

    if (availabilityStatus) {
      cy.clickAndSelectOption(
        '[data-cy="device-availability-status-select"]',
        availabilityStatus,
      );
    }

    if (identifier) {
      cy.typeIntoField('[data-cy="identifier-input"]', identifier);
    }

    if (manufacturer) {
      cy.typeIntoField('[data-cy="manufacturer-input"]', manufacturer);
    }
    if (manufactureDate) {
      // Validate date string before processing
      const date = new Date(manufactureDate);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid manufacture date: ${manufactureDate}`);
      }

      // Handle DatePicker component - click to open the popover
      cy.get('[data-cy="manufacture-date-input"]').click();
      // Wait for the calendar popover to be visible
      cy.get('[role="dialog"]').should("be.visible");

      // Extract date components for reliable selection
      const day = date.getDate();

      // Select the correct date, ensuring it's not disabled and is the exact day
      cy.get('[role="gridcell"]')
        .contains(new RegExp(`^${day}$`))
        .not('[aria-disabled="true"]')
        .first()
        .click();
    }

    if (expirationDate) {
      // Validate date string before processing
      const date = new Date(expirationDate);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid expiration date: ${expirationDate}`);
      }

      // Handle DatePicker component - click to open the popover
      cy.get('[data-cy="expiration-date-input"]').click();
      // Wait for the calendar popover to be visible
      cy.get('[role="dialog"]').should("be.visible");

      // Extract date components for reliable selection
      const day = date.getDate();

      // Select the correct date, ensuring it's not disabled and is the exact day
      cy.get('[role="gridcell"]')
        .contains(new RegExp(`^${day}$`))
        .not('[aria-disabled="true"]')
        .first()
        .click();
    }

    if (lotNumber) {
      cy.typeIntoField('[data-cy="lot-number-input"]', lotNumber);
    }

    if (serialNumber) {
      cy.typeIntoField('[data-cy="serial-number-input"]', serialNumber);
    }

    if (modelNumber) {
      cy.typeIntoField('[data-cy="model-number-input"]', modelNumber);
    }

    if (partNumber) {
      cy.typeIntoField('[data-cy="part-number-input"]', partNumber);
    }
    return this;
  }
  submitDeviceForm() {
    cy.get('[data-cy="save-device-button"]').should("not.be.disabled");
    cy.verifyAndClickElement('[data-cy="save-device-button"]', "Save");
    return this;
  }
  assertDeviceCreationSuccess() {
    cy.verifyNotification("Device registered successfully");
    return this;
  }
  searchDeviceList(deviceName: string) {
    cy.typeIntoField('[data-cy="search-devices-input"]', deviceName, {
      clearBeforeTyping: true,
    });
    return this;
  }
  clickDevice(deviceName: string) {
    cy.verifyAndClickElement(`[data-cy="devices-list"]`, deviceName);
    return this;
  }
  clickDeviceEditButton() {
    cy.verifyAndClickElement('[data-cy="edit-device-button"]', "Edit");
    return this;
  }
  clickDeviceDeleteButton() {
    // Intercept the delete request with dynamic facility and device IDs
    cy.intercept("DELETE", "/api/v1/facility/**/device/**").as("deleteDevice");

    cy.verifyAndClickElement('[data-cy="delete-device-button"]', "Delete");
    cy.verifyAndClickElement(
      '[data-cy="confirm-delete-device-button"]',
      "Delete",
    );

    // Wait for the delete request to complete and verify status code is 204
    cy.wait("@deleteDevice").its("response.statusCode").should("eq", 204);
    return this;
  }
  assertDeviceDetails(deviceName: string) {
    cy.verifyContentPresence('[data-cy="device-details"]', [deviceName]);
    return this;
  }

  navigateToFacilitySettings() {
    cy.get('[data-cy="nav-settings"]').click();
    return this;
  }

  assertDeviceUpdateSuccess() {
    cy.verifyNotification("Device updated successfully");
    return this;
  }
}
