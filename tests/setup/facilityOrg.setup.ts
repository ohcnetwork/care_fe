import { test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Ensures a second facility exists in the DB for resource request tests.
 * If only one facility exists, creates a new one by copying key fields
 * from the existing facility.
 */
test("ensure second facility exists for resource requests", async () => {
  const apiUrl = getApiUrl();
  const headers = getApiHeaders();

  const listRes = await fetch(`${apiUrl}/api/v1/facility/?limit=2`, {
    headers,
  });
  if (!listRes.ok) return;
  const listData = await listRes.json();
  if (listData.count !== 1) return;

  const existing = listData.results?.[0];
  if (!existing) return;

  // Fetch full details to get geo_organization
  const detailRes = await fetch(`${apiUrl}/api/v1/facility/${existing.id}/`, {
    headers,
  });
  if (!detailRes.ok) return;
  const detail = await detailRes.json();

  const geoOrgId =
    detail.geo_organization?.id ?? detail.geo_organization ?? null;
  if (!geoOrgId) return;

  const createRes = await fetch(`${apiUrl}/api/v1/facility/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Second Test Facility",
      facility_type: detail.facility_type ?? "2",
      phone_number: "+919876543210",
      pincode: detail.pincode ?? 682001,
      address: "Test Address for Second Facility",
      geo_organization: geoOrgId,
      features: [],
    }),
  });

  if (createRes.ok) {
    const created = await createRes.json();
    console.log(`✅ Second facility created: ${created.id}`);
  } else {
    const err = await createRes.text();
    console.warn(`⚠️ Failed to create second facility: ${err}`);
  }
});

/**
 * Ensures the facility's Administration organization has the required users
 * and is linked to the Bio-Chemistry Lab location.
 *
 * This prerequisite is needed for:
 * - Billing tests (care-fac-admin/care-nurse need org access)
 * - Multi-user notes/files tests (facilityAdmin/nurse need facility access)
 * - Payment reconciliation (location needs org for location selector)
 */
test("ensure facility org prerequisites", async () => {
  const facilityId = getFacilityId();
  const apiUrl = getApiUrl();
  const headers = getApiHeaders();

  // Get the Administration organization
  const orgRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/?limit=50`,
    { headers },
  );
  if (!orgRes.ok) return;
  const orgData = await orgRes.json();
  const adminOrg = orgData.results?.find(
    (o: { name: string }) => o.name === "Administration",
  );
  if (!adminOrg) return;

  // --- Ensure care-fac-admin and care-nurse are in the Administration org ---
  const membersRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/organizations/${adminOrg.id}/users/`,
    { headers },
  );
  if (!membersRes.ok) return;
  const membersData = await membersRes.json();
  const existingUsernames = (membersData.results ?? []).map(
    (m: { user: { username: string } }) => m.user.username,
  );

  const requiredUsers = [
    { username: "care-fac-admin", roleName: "Facility Admin" },
    { username: "care-nurse", roleName: "Nurse" },
    { username: "care-staff", roleName: "Staff" },
  ];

  // Get available roles
  const rolesRes = await fetch(`${apiUrl}/api/v1/role/?limit=50`, { headers });
  if (!rolesRes.ok) return;
  const rolesData = await rolesRes.json();

  for (const req of requiredUsers) {
    if (existingUsernames.includes(req.username)) continue;

    const userRes = await fetch(
      `${apiUrl}/api/v1/users/?username=${req.username}`,
      { headers },
    );
    if (!userRes.ok) continue;
    const userData = await userRes.json();
    const user = userData.results?.[0];
    if (!user) continue;

    const role = rolesData.results?.find(
      (r: { name: string; contexts: string[] }) =>
        r.name === req.roleName && r.contexts.includes("FACILITY"),
    );
    if (!role) continue;

    await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/${adminOrg.id}/users/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ user: user.id, role: role.id }),
      },
    );
  }

  // --- Ensure Bio-Chemistry Lab location has Administration org linked ---
  const locRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/?name=${encodeURIComponent("Bio-Chemistry Lab")}`,
    { headers },
  );
  if (!locRes.ok) return;
  const locData = await locRes.json();
  const location = locData.results?.find(
    (l: { name: string }) => l.name === "Bio-Chemistry Lab",
  );
  if (!location) return;

  const locOrgRes = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/${location.id}/organizations/`,
    { headers },
  );
  if (!locOrgRes.ok) return;
  const locOrgData = await locOrgRes.json();
  if (locOrgData.results?.length > 0) return;

  await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/location/${location.id}/organizations_add/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ organization: adminOrg.id }),
    },
  );
});
