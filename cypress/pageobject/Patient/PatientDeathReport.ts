class PatientDeathReport {
  clickDeathReport() {
    cy.get("#death-report").click();
  }

  verifyDeathReportAutofill(selector: string, value: string) {
    cy.get(selector).should("have.value", value);
  }

  clickPrintDeathReport() {
    cy.get("#print-deathreport").click();
  }
}
export default PatientDeathReport;
