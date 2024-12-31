describe("Login Page", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.saveLocalStorage();
    cy.visit("/login");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });

  it("should successfully login with admin credentials", () => {
    // Using Page Object Model
    cy.fixture("users").then((users) => {
      const { username, password } = users.admin;

      // Intercept the login API call
      cy.intercept("POST", "/api/v1/auth/login/").as("loginRequest");

      // Interact with elements using data-cy
      cy.get("[data-cy=username]").type(username);
      cy.get("[data-cy=password]").type(password);
      cy.get("[data-cy=submit]").click();

      // Wait for API response
      cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);

      // Verify redirect
      cy.url().should("include", "/");
    });
  });

  it("should display login form elements", () => {
    // Verify presence of login form elements
    cy.get("[data-cy=username]")
      .should("exist")
      .and("be.visible")
      .and("have.attr", "type", "text");

    cy.get("[data-cy=password]")
      .should("exist")
      .and("be.visible")
      .and("have.attr", "type", "password");

    cy.get("[data-cy=submit]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled");
  });

  it("should show validation errors for empty fields", () => {
    cy.get("[data-cy=submit]").click();

    // Verify error messages
    cy.get("[data-cy=username]")
      .parent()
      .find(".text-red-500")
      .should("be.visible");

    cy.get("[data-cy=password]")
      .parent()
      .find(".text-red-500")
      .should("be.visible");
  });
});
