import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";

export const DEFAULT_DISPOSABLE_USER_PASSWORD = "Ohcn@123";

export interface DisposableUser {
  username: string;
  phoneNumber: string;
  password: string;
}

export interface CreateDisposableUserOptions {
  password?: string;
  organizationSearch?: string;
  organizationOption?: string;
  roleSearch?: string;
  roleOption?: string;
}

/**
 * Creates a disposable governance user through the Users UI.
 * Caller must use an authenticated page (e.g. admin storageState).
 */
export async function createDisposableUserViaUi(
  page: Page,
  options: CreateDisposableUserOptions = {},
): Promise<DisposableUser> {
  const password = options.password ?? DEFAULT_DISPOSABLE_USER_PASSWORD;
  const organizationSearch = options.organizationSearch ?? "Nurse";
  const organizationOption = options.organizationOption ?? "Nurse";
  const roleSearch = options.roleSearch ?? "Member";
  const roleOption = options.roleOption ?? "Member";

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = `${firstName.toLowerCase()}${faker.string.numeric(4)}`;
  const email = faker.internet.email({ firstName, lastName });
  const phoneNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;
  const gender = faker.helpers.arrayElement([
    "Male",
    "Female",
    "Non Binary",
    "Transgender",
  ]);

  await page.goto("/");
  await page.getByRole("tab", { name: "Governance" }).click();
  await page
    .getByRole("link", { name: /Government$/ })
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Users" }).click();

  await page.getByRole("button", { name: "Add User" }).click();
  await page.getByRole("textbox", { name: "First Name" }).fill(firstName);
  await page.getByRole("textbox", { name: "Last Name" }).fill(lastName);
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="c_password"]').fill(password);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Phone Number" }).fill(phoneNumber);
  await page.getByRole("combobox", { name: "Gender" }).click();
  await page.getByRole("option", { name: gender, exact: true }).click();

  await page
    .getByRole("combobox")
    .filter({ hasText: "Select organization" })
    .click();
  await page.getByPlaceholder("Search organization").fill(organizationSearch);
  await page.getByRole("option", { name: organizationOption }).click();
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select designation" })
    .click();
  await page.getByPlaceholder("Search Roles").fill(roleSearch);
  await page.getByRole("option", { name: roleOption }).click();

  const createUserResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/users/") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create User" }).click();
  const response = await createUserResponse;
  expect(response.status()).toBe(200);

  return { username, phoneNumber, password };
}
