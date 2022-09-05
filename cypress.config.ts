import { defineConfig } from "cypress";

import fs from "fs";

export default defineConfig({
  defaultCommandTimeout: 10000,

  e2e: {
    setupNodeEvents(on, config) {
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
  },
});
