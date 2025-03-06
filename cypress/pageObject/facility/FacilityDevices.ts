export class FacilityDevices {
  navigateToDevices() {
    cy.verifyAndClickElement('[data-cy="settings-tab-devices"]', "Devices");
    return this;
  }

  clickAddDeviceButton() {
    cy.verifyAndClickElement('[data-cy="add-device-button"]', "Add Device");
    return this;
  }
}
