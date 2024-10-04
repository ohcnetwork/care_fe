import { test, expect } from "@playwright/test";

test("successful login test", async ({ page }) => {
  // Step 1: Navigate to the login page
  await page.goto("http://localhost:4000/"); // Update the URL to your app's login page

  // Step 2: Fill in the login form
  await page.fill("#username", "devdistrictadmin"); // Update the selector and username
  await page.fill("#password", "Coronasafe@123"); // Update the selector and password

  // Step 3: Click the login button
  await page.click('button:text("Login")'); // Update the selector to your login button

  // Step 4: Assert that the user is redirected to the dashboard
  await expect(page).toHaveURL("http://localhost:4000/facility"); // Update to the correct URL after login
});
