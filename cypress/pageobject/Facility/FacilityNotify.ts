export default class FacilityNotify {
  verifyFacilityName(facilityName: string) {
    cy.verifyContentPresence("#notify-facility-name", [facilityName]);
  }

  verifyErrorMessage(errorMessage: string) {
    cy.verifyContentPresence(".error-text", [errorMessage]);
  }

  fillNotifyText(message: string) {
    cy.get("#NotifyModalMessageInput").scrollIntoView();
    cy.get("#NotifyModalMessageInput").click().type(message);
  }

  openNotificationSlide() {
    cy.get("#notification-slide-btn").should("be.visible").click();
  }

  closeNotificationSlide() {
    cy.get("#close-slide-over").should("be.visible").click();
  }

  visitNoticeBoard() {
    cy.get("a[href='/notice_board']").should("be.visible").click();
  }

  visitNotificationSideBar() {
    cy.get("#notification-slide-btn").should("be.visible").click();
  }

  verifyUrlContains(substring: string) {
    cy.url().should("include", substring);
  }

  interceptPostNotificationReq() {
    cy.intercept("POST", "**/api/v1/notification/notify").as("notifyFacility");
  }

  verifyPostNotificationReq() {
    cy.wait("@notifyFacility").its("response.statusCode").should("eq", 204);
  }

  interceptGetNotificationReq() {
    cy.intercept("GET", "**/api/v1/notification/**").as("getNotifications");
  }

  verifyGetNotificationReq() {
    cy.wait("@getNotifications").its("response.statusCode").should("eq", 200);
  }
}
