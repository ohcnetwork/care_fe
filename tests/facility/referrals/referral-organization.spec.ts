import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  openMultiFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test("configures an organization destination and receives its referral in the organization inbox", async ({
  page,
  request,
}) => {
  test.slow();
  const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
  const organizationName = `Referral network ${suffix}`;
  const availabilityName = `Organization service ${suffix}`;
  const formTitle = `Organization intake ${suffix}`;
  const referralTitle = `Organization consultation ${suffix}`;
  const answer = `Network assessment requested ${suffix}`;
  const questionId = faker.string.uuid();
  const post = async (path: string, data: unknown) => {
    const response = await request.post(`${apiBaseUrl()}${path}`, {
      headers: adminApiHeaders(),
      data,
    });
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    return response.json();
  };
  const organization = await post("/api/v1/organization/", {
    name: organizationName,
    description: "Organization referral inbox test",
    org_type: "govt",
    metadata: {},
  });
  const form = await post("/api/v1/questionnaire/", {
    auth_context: "instance",
    slug: `organization-intake-${suffix}`,
    title: formTitle,
    description: "Organization referral request",
    status: "active",
    subject_type: "encounter",
    actions: [],
    questions: [
      {
        id: questionId,
        link_id: "reason",
        text: "Referral reason",
        type: "string",
        required: true,
      },
    ],
  });
  let availabilityId: string;

  await test.step("Configure the organization through its admin entry point", async () => {
    await page.goto(`/admin/organizations/govt/${organization.id}`);
    await page
      .getByRole("link", { name: "Referral availability", exact: true })
      .click();
    await expect(page).toHaveURL(
      `/organization/${organization.id}/settings/referrals`,
    );
    await page
      .getByRole("button", { name: "Add referral availability", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Add referral availability",
      exact: true,
    });
    await expect(dialog).toContainText(organizationName);
    await dialog
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(availabilityName);
    await dialog
      .getByRole("combobox", { name: "Search active forms", exact: true })
      .click();
    await page
      .getByPlaceholder("Search option...", { exact: true })
      .fill(formTitle);
    await page.getByRole("option", { name: formTitle, exact: true }).click();
    await dialog.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: "Active", exact: true }).click();
    const created = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/referral_availability/" &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Add referral availability", exact: true })
      .click();
    const response = await created;
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    const availability = await response.json();
    expect(availability).toMatchObject({
      entity_type: "external_organization",
      external_organization: organization.id,
      facility: null,
      internal_organization: null,
    });
    availabilityId = availability.id;
    await expect(dialog).not.toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("listitem").filter({
        has: page.getByRole("heading", { name: availabilityName, exact: true }),
      }),
    ).toContainText("Active");
  });

  const referral = await post("/api/v1/referral/", {
    availability: availabilityId!,
    patient: getPatientId(),
    encounter: getEncounterId(),
    title: referralTitle,
    note: "",
    questionnaire: form.id,
    questionnaire_response: {
      results: [{ question_id: questionId, values: [{ value: answer }] }],
    },
  });

  await test.step("Read incoming referrals with persisted filters and a working detail return link", async () => {
    const incoming = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/v1/referral/" &&
        url.searchParams.get("entity_type") === "external_organization" &&
        url.searchParams.get("entity_id") === organization.id &&
        !url.searchParams.has("direction")
      );
    });
    await page
      .getByRole("menuitem", { name: "Referrals", exact: true })
      .click();
    expect((await incoming).ok()).toBeTruthy();
    await expect(page).toHaveURL(`/organization/${organization.id}/referrals`);
    await expect(
      page.getByRole("heading", { name: "Incoming referrals", exact: true }),
    ).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: referralTitle });
    await expect(row).toHaveCount(1);
    await expect(
      row.getByRole("group", { name: "To", exact: true }),
    ).toContainText(organizationName);
    await openMultiFilter(page, /^Status$/);
    await page.getByRole("menu").getByText("Pending", { exact: true }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(selectedMultiFilterBar(page, /^Status$/)).toContainText(
      "Pending",
    );
    await row.hover();
    await row.getByRole("link", { name: referralTitle, exact: true }).click();
    await expect(page).toHaveURL(
      (url) => url.pathname === `/referrals/${referral.id}`,
    );
    await expect(page.getByText(answer, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/organization/${organization.id}/referrals` &&
        url.searchParams.get("referralStatus") === "pending",
    );
    await expect(row).toBeVisible();
  });
});
