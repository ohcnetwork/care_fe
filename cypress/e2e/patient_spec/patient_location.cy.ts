// import { PatientLocation } from "@/pageObject/Patients/PatientLocation";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
// const patientLocation = new PatientLocation();

describe("Add a new Location and associate to an Encounter", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("raj");
    cy.visit("/");
    facilityCreation.selectFacility("MEDICAL FACILITY");
  });

  it("Create a new Location", () => {});

  it("Dissociate existing Location from encounter and associate new location", () => {});
});
