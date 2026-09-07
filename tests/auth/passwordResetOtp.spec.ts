import { faker } from "@faker-js/faker";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import {
  createDisposableUserViaUi,
  DEFAULT_DISPOSABLE_USER_PASSWORD,
} from "tests/helper/user";

const LOCAL_OTP = "45612";

async function openPhonePasswordReset(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /forgot password/i }).click();
  await page.getByText(/reset using phone number/i).click();
}

async function fillPhoneAndSendOtp(page: Page, phoneNumber: string) {
  await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
  await page.getByRole("button", { name: /send otp/i }).click();
}

async function fillOtp(page: Page, otp: string) {
  await page.locator("#reset_otp").click();
  await page.locator("#reset_otp").pressSequentially(otp);
}

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
  test("resets password using phone OTP for a user", async ({ browser }) => {
    const user = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );

    const page = await browser.newPage();

    await test.step("Request password reset OTP", async () => {
      await openPhonePasswordReset(page);
      await fillPhoneAndSendOtp(page, user.phoneNumber);
      await expectToast(
        page,
        /if this phone number is registered, you will receive an otp/i,
      );
    });

    await test.step("Confirm with OTP and same password", async () => {
      await fillOtp(page, LOCAL_OTP);
      await page.getByPlaceholder(/new password/i).fill(user.password);
      await page.getByPlaceholder(/confirm password/i).fill(user.password);
      await page.getByRole("button", { name: /^reset password$/i }).click();
      await expectToast(page, /password reset successfully/i);
    });

    await test.step("Return to staff login form", async () => {
      await expect(
        page.getByRole("textbox", { name: /username/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
    });

    await page.close();
  });

  test("shows error for invalid OTP", async ({ browser }) => {
    const user = await withAdminPage(browser, (page) =>
      createDisposableUserViaUi(page),
    );

    const page = await browser.newPage();

    await openPhonePasswordReset(page);
    await fillPhoneAndSendOtp(page, user.phoneNumber);
    await expectToast(
      page,
      /if this phone number is registered, you will receive an otp/i,
    );

    await fillOtp(page, "00000");
    await page
      .getByPlaceholder(/new password/i)
      .fill(DEFAULT_DISPOSABLE_USER_PASSWORD);
    await page
      .getByPlaceholder(/confirm password/i)
      .fill(DEFAULT_DISPOSABLE_USER_PASSWORD);
    await page.getByRole("button", { name: /^reset password$/i }).click();

    await expectToast(page, /invalid otp/i);
    await expect(page.getByRole("textbox", { name: /username/i })).toBeHidden();

    await page.close();
  });

  test("shows generic success toast for unknown phone number", async ({
    page,
  }) => {
    const unknownPhone = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;

    await openPhonePasswordReset(page);
    await fillPhoneAndSendOtp(page, unknownPhone);

    await expectToast(
      page,
      /if this phone number is registered, you will receive an otp/i,
    );
  });
});
