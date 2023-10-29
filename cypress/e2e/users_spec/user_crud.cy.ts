// import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";

// const makeid = (length: number) => {
//   let result = "";
//   const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
//   const charactersLength = characters.length;
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// };

// const username = makeid(25);

// describe("User management", () => {
//   before(() => {
//     cy.loginByApi("devdistrictadmin", "Coronasafe@123");
//     cy.saveLocalStorage();
//   });

//   beforeEach(() => {
//     cy.restoreLocalStorage();
//     cy.awaitUrl("/user");
//   });

//   it("link facility for user", () => {
//     cy.contains("Linked Facilities").click();
//     cy.intercept(/\/api\/v1\/facility/).as("getFacilities");
//     cy.get("[name='facility']")
//       .click()
//       .type("Dummy Facility 1")
//       .wait("@getFacilities");
//     cy.get("li[role='option']").first().click();
//     cy.intercept(/\/api\/v1\/users\/\w+\/add_facility\//).as("addFacility");
//     cy.get("button[id='link-facility']").click();
//     cy.wait("@addFacility")
//       // .its("response.statusCode")
//       // .should("eq", 201)
//       .get("span")
//       .contains("Facility - User Already has permission to this facility");
//   });

//   afterEach(() => {
//     cy.saveLocalStorage();
//   });
// });

// describe("Edit User Profile & Error Validation", () => {
//   before(() => {
//     cy.loginByApi(username, "#@Cypress_test123");
//     cy.saveLocalStorage();
//   });

//   beforeEach(() => {
//     cy.restoreLocalStorage();
//     cy.awaitUrl("/user/profile");
//     cy.contains("button", "Edit User Profile").click();
//   });

//   it("First name Field Updation " + username, () => {
//     cy.get("input[name=firstName]").clear();
//     cy.contains("button[type='submit']", "Update").click();
//     cy.get("span.error-text").should("contain", "Field is required");
//     cy.get("input[name=firstName]").type("firstName updated");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   it("Last name Field Updation " + username, () => {
//     cy.get("input[name=lastName]").clear();
//     cy.contains("button[type='submit']", "Update").click();
//     cy.get("span.error-text").should("contain", "Field is required");
//     cy.get("input[name=lastName]").type("lastName updated");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   it("Age Field Updation " + username, () => {
//     cy.get("input[name=age]").clear();
//     cy.contains("button[type='submit']", "Update").click();
//     cy.get("span.error-text").should("contain", "This field is required");
//     cy.get("input[name=age]").type("11");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   it("Phone number Field Updation " + username, () => {
//     cy.get("input[name=phoneNumber]").clear();
//     cy.contains("button[type='submit']", "Update").click();
//     cy.get("span.error-text").should(
//       "contain",
//       "Please enter valid phone number"
//     );
//     cy.get("input[name=phoneNumber]").type("+919999999999");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   it("Whatsapp number Field Updation " + username, () => {
//     cy.get("input[name=altPhoneNumber]").clear();
//     cy.get("input[name=altPhoneNumber]").type("+919999999999");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   it("Email Field Updation " + username, () => {
//     cy.get("input[name=email]").clear();
//     cy.contains("button[type='submit']", "Update").click();
//     cy.get("span.error-text").should("contain", "This field is required");
//     cy.get("input[name=email]").type("test@test.com");
//     cy.contains("button[type='submit']", "Update").click();
//   });

//   afterEach(() => {
//     cy.saveLocalStorage();
//   });
// });

// // describe("Delete User", () => { district admin wont be able to delete user
// //   it("deletes user", () => {
// //     cy.loginByApi("devdistrictadmin", "Coronasafe@123");
// //     cy.awaitUrl("/user");
// //     cy.get("[name='username']").type(username);
// //     cy.get("button")
// //       .should("contain", "Delete")
// //       .contains("Delete")
// //       .click();
// //     cy.get("button.font-medium.btn.btn-danger").click();
// //   });
// // });

// this file is getting refactored, the remaining commented out code are depended to each other and will be breaking. New code will be pushed in a week
