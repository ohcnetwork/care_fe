export class ManageUserPage {
  assertHomeFacility(expectedText) {
    cy.get("#home_facility").should("contain.text", expectedText);
  }

  clickFacilitiesTab() {
    cy.get("#facilities").click();
  }

  selectFacilityFromDropdown(facilityName) {
    cy.searchAndSelectOption("input[name='facility']", facilityName);
  }

  selectSkillFromDropdown(skill) {
    cy.searchAndSelectOption("input[name='skill']", skill);
  }

  clickLinkFacility() {
    cy.get("#link-facility").click();
  }

  assertLinkedFacility(facilityName) {
    cy.get("#linked-facility-list").should("contain.text", facilityName);
  }

  assertnotLinkedFacility(facilityName) {
    cy.get("#linked-facility-list").should("not.contain", facilityName);
  }

  linkedfacilitylistnotvisible() {
    cy.get("#linked-facility-list").should("not.exist");
  }

  assertHomeFacilitylink(facilityName) {
    cy.get("#home-facility").should("contain.text", facilityName);
  }

  assertFacilityNotInDropdown(facilityName) {
    cy.get("input[name='facility']").click().type(facilityName);
    cy.get("[role='option']").should("not.exist");
  }

  clickCloseSlideOver() {
    cy.get("#close-slide-over").click({ force: true });
  }

  clickHomeFacilityIcon() {
    cy.get("#home-facility-icon").click();
  }

  clickUnlinkFacilityButton() {
    cy.get("#unlink-facility-button").click();
  }

  clickSubmit() {
    cy.get("#submit").click();
  }

  clicksetaveragehourbutton() {
    cy.get("#avg-workinghour").click();
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
    cy.wait("@getUsers").its("response.statusCode").should("eq", 200);
  }

  verifyWorkingHours(expectedHours: string) {
    cy.get("#working-hours").should("contain", `${expectedHours} hours`);
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

  typeFacilitySearch(facilityName) {
    cy.get("#search").click().clear();
    cy.get("#search").click().type(facilityName);
  }

  assertFacilityInCard(facilityName) {
    cy.get("#facility-name-card").should("contain", facilityName);
  }

  clickFacilityPatients() {
    cy.get("#facility-patients").should("be.visible");
    cy.get("#facility-patients").click();
  }

  clicklinkedskillbutton() {
    cy.get("#skills").click();
  }

  clickAddSkillButton() {
    cy.intercept("GET", "**/api/v1/skill/**").as("getSkills");
    cy.get("#add-skill-button").click();
    cy.wait("@getSkills").its("response.statusCode").should("eq", 200);
  }

  assertSkillInAlreadyLinkedSkills(skillName) {
    cy.get("#already-linked-skills")
      .contains(skillName)
      .should("have.length", 1);
  }

  assertSkillIndoctorconnect(skillName) {
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

  assertSkillInAddedUserSkills(skillName) {
    cy.get("#added-user-skills").should("contain", skillName);
  }

  assertDoctorConnectVisibility(realName) {
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
