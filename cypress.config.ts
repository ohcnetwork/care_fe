import { defineConfig } from "cypress";

import fs from "fs";

export default defineConfig({
  projectId: "wf7d2m",
  defaultCommandTimeout: 10000,
  e2e: {
    setupNodeEvents(on, _) {
      // implement node event listeners here
      on("task", {
        readFileMaybe(filename) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, "utf8");
          }

          return null;
        },
      });
    },
    baseUrl: "http://localhost:4000",
    retries: 2,
    requestTimeout: 15000,
    excludeSpecPattern: "**/*roles.cy.ts",
  },
});
