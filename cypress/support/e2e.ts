import "@/support/commands";

// Global error handling
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("ResizeObserver")) {
    return false;
  }
  return true;
});
