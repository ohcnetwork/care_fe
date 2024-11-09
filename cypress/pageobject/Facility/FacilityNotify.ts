export default class FacilityNotify {
  verifyFacilityName(facilityName: string): void {
    cy.verifyContentPresence("#notify-facility-name", [facilityName]);
  }

  verifyErrorMessage(errorMessage: string): void {
    cy.verifyContentPresence(".error-text", [errorMessage]);
  }

  fillNotifyText(message: string): void {
    cy.get("#NotifyModalMessageInput").should("be.visible").type(message);
  }

  openNotificationSlide(): void {
    cy.get("#notification-slide-btn").should("be.visible").click();
  }

  closeNotificationSlide(): void {
    cy.get("#close-slide-over").should("be.visible").click();
  }

  visitNoticeBoard(): void {
    cy.get("a[href='/notice_board']").should("be.visible").click();
  }

  updateUrl(): void {
    cy.awaitUrl(
      "http://localhost:4000/facility?page=1&limit=14&search=Dummy+Facility+40",
    );
  }

  interceptFacilitySearchReq(): void {
    cy.intercept("GET", "**/api/v1/facility/**").as("searchFacility");
  }
  verifyFacilitySearchReq(): void {
    cy.wait("@searchFacility").its("response.statusCode").should("eq", 200);
  }

  interceptPostNotificationReq(): void {
    cy.intercept("POST", "**/api/v1/notification/notify").as("notifyFacility");
  }

  verifyPostNotificationReq(): void {
    cy.wait("@notifyFacility").its("response.statusCode").should("eq", 204);
  }

  interceptGetNotificationReq(): void {
    cy.intercept("GET", "**/api/v1/notification/**").as("getNotifications");
  }

  verifyGetNotificationReq(): void {
    cy.wait("@getNotifications").its("response.statusCode").should("eq", 200);
  }
}
