import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup that runs once before all tests.
 * Verifies backend connectivity and performs any necessary initialization.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log("\n🔧 Running global setup...");
  console.log(`📍 Base URL: ${baseURL}`);

  // Launch a browser to verify backend connectivity
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if the application is accessible
    console.log("🌐 Checking application accessibility...");
    await page.goto(baseURL || "http://localhost:4000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait a bit for the app to initialize
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      console.log("⚠️ Network not idle, but continuing...");
    });

    console.log("✅ Application is accessible");
  } catch (error) {
    console.error("❌ Failed to access application:", error);
    throw new Error(
      `Application is not accessible at ${baseURL}. Please ensure the backend is running.`,
    );
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log("✅ Global setup completed\n");
}

export default globalSetup;
