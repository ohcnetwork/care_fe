import { faker } from "@faker-js/faker";
import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  LOCAL_DEV_OTP,
  requestPasswordResetOtpViaUi,
  resetPasswordViaUi,
  submitPasswordResetOtpViaUi,
} from "tests/helper/auth";
import { expectToast } from "tests/helper/ui";
import {
  createDisposableUserViaUi,
  DEFAULT_DISPOSABLE_USER_PASSWORD,
} from "tests/helper/user";

async function withAdminPage<T>(
  browser: Browser,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  try {
    return await run(page);
  } finally {
    await context.close();
  }
}

test.describe("OTP password reset", () => {
  test(
    "resets password using phone OTP for a user",
    { tag: ["@atomic", "@cap:auth.password-reset"] },
    async ({ browser }) => {
      const user = await withAdminPage(browser, (page) =>
        createDisposableUserViaUi(page),
      );

      const page = await browser.newPage();

      // Request an OTP, then confirm it with the same password.
      await resetPasswordViaUi(page, {
        phoneNumber: user.phoneNumber,
        otp: LOCAL_DEV_OTP,
        newPassword: user.password,
      });

      await test.step("Return to staff login form", async () => {
        await expect(
          page.getByRole("textbox", { name: /username/i }),
        ).toBeVisible();
        await expect(page.getByLabel(/^password$/i)).toBeVisible();
        await expect(
          page.getByRole("button", { name: /^sign in$/i }),
        ).toBeVisible();
      });

      await page.close();
    },
  );

  test(
    "shows error for invalid OTP",
    { tag: ["@atomic", "@cap:auth.password-reset"] },
    async ({ browser }) => {
      const user = await withAdminPage(browser, (page) =>
        createDisposableUserViaUi(page),
      );

      const page = await browser.newPage();

      await requestPasswordResetOtpViaUi(page, {
        phoneNumber: user.phoneNumber,
      });
      await expectToast(
        page,
        /if this phone number is registered, you will receive an otp/i,
      );

      await submitPasswordResetOtpViaUi(page, {
        otp: "00000",
        newPassword: DEFAULT_DISPOSABLE_USER_PASSWORD,
      });

      await expectToast(page, /invalid otp/i);
      await expect(
        page.getByRole("textbox", { name: /username/i }),
      ).toBeHidden();

      await page.close();
    },
  );

  test(
    "shows generic success toast for unknown phone number",
    { tag: ["@atomic", "@cap:auth.password-reset"] },
    async ({ page }) => {
      const unknownPhone = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;

      await requestPasswordResetOtpViaUi(page, { phoneNumber: unknownPhone });

      await expectToast(
        page,
        /if this phone number is registered, you will receive an otp/i,
      );
    },
  );
});
