import { chromium, FullConfig } from "@playwright/test";
import { loginAsDistrictAdmin } from "./helpers/login-helper";

async function globalSetup(config: FullConfig) {
  const { storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Perform login and save session state to storageState.json
  await loginAsDistrictAdmin(context);

  // Ensure storage state is saved for use in future tests
  await context.storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
