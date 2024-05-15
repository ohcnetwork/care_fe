import { defineConfig } from "cypress";
import fs from "fs";
import cypressSplit from "cypress-split";

export default defineConfig({
  projectId: "wf7d2m",
  defaultCommandTimeout: 10000,
  e2e: {
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

      return config;
    },
    baseUrl: "http://localhost:4000",
    retries: 2,
    requestTimeout: 15000,
    excludeSpecPattern: "**/*roles.cy.ts",
  },
});
