export class ManageUserPage {
  assertHomeFacility(expectedText: string) {
    cy.get("#home-facility").should("contain.text", expectedText);
  }

  selectFacilityFromDropdown(facilityName: string) {
    cy.typeAndSelectOption("input[name='facility']", facilityName);
  }

  selectSkillFromDropdown(skill: string) {
    cy.typeAndSelectOption("input[name='skill']", skill);
  }

  assertLinkedFacility(facilityName: string) {
    cy.get("#linked-facility-list").should("contain.text", facilityName);
  }

  assertnotLinkedFacility(facilityName: string) {
    cy.get("#linked-facility-list").should("not.contain", facilityName);
  }

  linkedfacilitylistnotvisible() {
    cy.get("#linked-facility-list").should("not.exist");
  }

  assertHomeFacilitylink(facilityName: string) {
    cy.get("#home-facility").should("contain.text", facilityName);
  }

  assertFacilityNotInDropdown(facilityName: string) {
    cy.get("input[name='facility']").click().type(facilityName);
    cy.get("[role='option']").should("not.exist");
  }

  clickLinkedFacilitySettings() {
    cy.get("#linked-facility-settings").click();
  }

  clickSetHomeFacility() {
    cy.get("#set-home-facility").click();
  }

  clickUnlinkFacilityButton() {
    cy.get("#unlink-facility").click();
  }

  clickConfirmUnlinkSkill() {
    cy.get("button[name='confirm-unlink-skill']").click();
  }

  clickLinkFacility() {
    cy.get("#link-facility").click();
  }

  clickSubmit() {
    cy.get("#submit").click();
  }

  clearweeklyhourfield() {
    cy.get("#weekly_working_hours").click().clear();
  }

  verifyErrorText(expectedError: string) {
    cy.get(".error-text").should("contain", expectedError).and("be.visible");
  }

  typeInWeeklyWorkingHours(hours: string) {
    cy.get("#weekly_working_hours").click().type(hours);
  }

  navigateToProfile() {
    cy.intercept("GET", "**/api/v1/users/**").as("getUsers");
    cy.get("#user-profile-name").click();
    cy.get("#profile-button").click();
    cy.wait("@getUsers").its("response.statusCode").should("eq", 200);
  }

  verifyWorkingHours(expectedHours: string) {
    cy.get("input[name='weekly_working_hours']").should("be.visible");
    cy.get("input[name='weekly_working_hours']").should(
      "have.value",
      expectedHours,
    );
  }

  verifyProfileWorkingHours(expectedHours: string) {
    cy.get("#averageworkinghour-profile-details").should(
      "contain",
      expectedHours,
    );
  }

  navigateToFacility() {
    cy.visit("/facility");
  }

  navigateToManageUser() {
    cy.visit("/users");
  }

  typeFacilitySearch(facilityName: string) {
    cy.get("#search").click().clear();
    cy.get("#search").click().type(facilityName);
  }

  interceptFacilitySearchReq() {
    cy.intercept("GET", "**/api/v1/facility/**").as("searchFacility");
  }

  verifyFacilitySearchReq() {
    cy.wait("@searchFacility").its("response.statusCode").should("eq", 200);
  }

  assertFacilityInCard(facilityName: string) {
    cy.get("#facility-name-card").should("contain", facilityName);
  }

  clickFacilityPatients() {
    cy.get("#facility-patients").should("be.visible");
    cy.get("#facility-patients").click();
  }

  clickLinkedSkillTab() {
    cy.get("#skills").click();
  }

  clickLinkedFacilitiesTab() {
    cy.get("#facilities").click();
  }

  clickMoreDetailsButton(username: string) {
    cy.get(`#more-details-${username}`).click();
  }

  verifyMoreDetailsPage() {
    cy.get("#users-name").should("be.visible");
    cy.get("#username").should("be.visible");
    cy.get("#role").should("be.visible");
    cy.get("#usermanagement_tab_nav").should("be.visible");
    cy.get("#profile").should("be.visible");
    cy.get("#facilities").should("be.visible");
    cy.get("#skills").should("be.visible");
  }

  verifyProfileTabPage() {
    cy.get("#user-edit-form").should("be.visible");
  }

  verifyDoctorQualification() {
    cy.get("input[name='qualification']").should("be.visible");
  }

  verifyLinkedSkillsTabPage() {
    cy.get("#select-skill").scrollIntoView();
    cy.get("#select-skill").should("be.visible");
  }

  verifyLinkedFacilitiesTabPage() {
    cy.get("#select-facility").should("be.visible");
  }

  clickAddSkillButton() {
    cy.intercept("GET", "**/api/v1/skill/**").as("getSkills");
    cy.get("#add-skill-button").click();
    cy.wait("@getSkills").its("response.statusCode").should("eq", 200);
  }

  assertSkillInAlreadyLinkedSkills(skillName: string) {
    cy.get("#already-linked-skills")
      .contains(skillName)
      .should("have.length", 1);
  }

  assertSkillIndoctorconnect(skillName: string) {
    cy.get("#doctor-connect-home-doctor")
      .contains(skillName)
      .should("have.length", 1);
  }

  clickDoctorConnectButton() {
    cy.get("#doctor-connect-patient-button").click();
  }

  clickUnlinkSkill() {
    cy.get("#unlink-skill").click();
  }

  verifyUnlinkSkillModal() {
    cy.get("#unlink-skill-modal-description").should("be.visible");
    cy.get("button[name='confirm-unlink-skill']").should("be.visible");
  }

  assertSkillInAddedUserSkills(skillName: string) {
    cy.get("#added-user-skills").should("contain", skillName);
  }

  assertSkillNotInAddedUserSkills(skillName: string) {
    cy.get("#added-user-skills").should("not.contain", skillName);
  }

  assertDoctorConnectVisibility(realName: string) {
    cy.get('*[id="doctor-connect-home-doctor"]').should(
      "contain.text",
      realName,
    );
    cy.get('*[id="doctor-connect-remote-doctor"]').should(
      "contain.text",
      realName,
    );
  }

  assertVideoConnectLink(docName: string, link: string) {
    cy.get("ul#options")
      .find("li")
      .contains(docName)
      .within(() => {
        cy.get("a").should(($a) => {
          const hrefs = $a.map((i, el) => Cypress.$(el).attr("href")).get();
          expect(hrefs).to.include(link);
        });
      });
  }
}

export default ManageUserPage;
