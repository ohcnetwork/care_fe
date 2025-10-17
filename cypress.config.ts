import { defineConfig } from "cypress";
import cypressSplit from "cypress-split";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export default defineConfig({
  projectId: "wf7d2m",
  defaultCommandTimeout: 10000,

  e2e: {
    excludeSpecPattern: [
      "cypress/e2e/facility_spec/settings_spec/labs_spec/observation.cy.ts",
      "cypress/e2e/patient_spec/patient_prescription.cy.ts",
      "cypress/e2e/facility_spec/settings_spec/labs_spec/specimen.cy.ts",
    ],
    setupNodeEvents(on, config) {
      // implement node event listeners here

      require("cypress-localstorage-commands/plugin")(on, config); // eslint-disable-line

      on("task", {
        readFileMaybe(filename) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, "utf8");
          }

          return null;
        },
      });

      if (process.env.CYPRESS_SPLIT_TESTS === "true") {
        cypressSplit(on, config);
      }

      // Add required environment parameters for parallel execution
      config.env = {
        ...config.env,
        osName: "linux",
        osVersion: "Ubuntu",
        browserName: "Chrome",
        browserVersion: "136",
      };

      return config;
    },
    baseUrl: "http://localhost:4000",
    retries: {
      runMode: 1,
      openMode: 0,
    },
    requestTimeout: 15000,
    numTestsKeptInMemory: 15,
    experimentalMemoryManagement: true,
    watchForFileChanges: false,
    trashAssetsBeforeRuns: true,
  },

  env: {
    API_URL: process.env.REACT_CARE_API_URL,
    ENABLE_HCX: process.env.REACT_ENABLE_HCX ?? false,
  },
});
