import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("all department memberships and their roles remain reachable beyond the first page", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const stamp = faker.string.alphanumeric(8);
  const username = `membership-${stamp.toLowerCase()}`;
  const userResponse = await request.post(`${api}/api/v1/users/`, {
    headers,
    data: {
      username,
      first_name: "Membership",
      last_name: stamp,
      email: `${username}@example.test`,
      phone_number: `+919${faker.string.numeric(9)}`,
      gender: "non_binary",
      role_orgs: [],
    },
  });
  expect(userResponse.ok(), await userResponse.text()).toBe(true);
  const user = (await userResponse.json()) as { id: string };
  const rolesResponse = await request.get(`${api}/api/v1/role/?limit=100`, {
    headers,
  });
  expect(rolesResponse.ok()).toBe(true);
  const roles = (await rolesResponse.json()) as {
    results: { id: string; name: string }[];
  };
  const role = roles.results.find((item) => item.name === "Nurse");
  expect(role).toBeDefined();
  const names: string[] = [];
  for (let index = 0; index < 16; index++) {
    const name = `Membership ${stamp} ${String(index).padStart(2, "0")}`;
    names.push(name);
    const created = await request.post(
      `${api}/api/v1/facility/${facilityId}/organizations/`,
      { headers, data: { name, org_type: "dept", active: true } },
    );
    expect(created.ok(), await created.text()).toBe(true);
    const department = (await created.json()) as { id: string };
    const assigned = await request.post(
      `${api}/api/v1/facility/${facilityId}/organizations/${department.id}/users/`,
      { headers, data: { user: user.id, role: role!.id } },
    );
    expect(assigned.ok(), await assigned.text()).toBe(true);
  }
  await page.goto(`/facility/${facilityId}/users/${username}/departments`);
  await expect(
    page.getByRole("link", { name: /^Membership / }).first(),
  ).toBeVisible();
  const namesOnFirstPage = await page
    .getByRole("link", { name: /^Membership / })
    .allTextContents();
  await page
    .getByRole("button", { name: "Go to next page", exact: true })
    .click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("link", { name: /^Membership / }).first(),
  ).toBeVisible();
  const namesOnSecondPage = await page
    .getByRole("link", { name: /^Membership / })
    .allTextContents();
  expect(new Set([...namesOnFirstPage, ...namesOnSecondPage])).toEqual(
    new Set(names),
  );
  const lastMembership = page.getByRole("row").filter({
    has: page.getByRole("link", { name: namesOnSecondPage[0], exact: true }),
  });
  await expect(lastMembership).toContainText("Nurse");
  await expect(
    lastMembership.getByRole("button", { name: "Edit Role", exact: true }),
  ).toBeVisible();
});
