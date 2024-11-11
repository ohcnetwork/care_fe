import { defineConfig } from "cypress";
import cypressSplit from "cypress-split";
import fs from "fs";

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
  },
  env: {
    API_URL: process.env.REACT_CARE_API_URL ?? "http://localhost:9000",
    ENABLE_HCX: process.env.REACT_ENABLE_HCX ?? false,
  },
});
