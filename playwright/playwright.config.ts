import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  use: {
    baseURL: "http://localhost:4000/", // Replace with your actual base URL
    storageState: "storageState.json", // Use the saved session state
    headless: true, // Use headless browser by default
    viewport: { width: 1280, height: 720 }, // Set the default viewport size
  },
  globalSetup: "./global-setup.ts", // Add the global setup script
};

export default config;
