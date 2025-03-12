export class FacilityDevices {
  navigateToDevices() {
    cy.verifyAndClickElement('[data-cy="settings-tab-devices"]', "Devices");
    return this;
  }

  clickAddDeviceButton() {
    cy.verifyAndClickElement('[data-cy="add-device-button"]', "Add Device");
    return this;
  }

  enterRegisteredDeviceName(deviceName: string) {
    cy.typeIntoField('[data-cy="device-registered-name"]', deviceName);
    return this;
  }

  clickSubmitDeviceForm() {
    cy.clickSubmitButton("Save");
    return this;
  }
}
