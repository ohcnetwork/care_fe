import { expect, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { createReferralFixture } from "tests/helper/referrals";

test.use({ storageState: "tests/.auth/user.json" });

test("retains a do-not-perform order warning in a shared service-request preview", async ({
  page,
  request,
}) => {
  const fixture = await createReferralFixture(request);
  const headers = adminApiHeaders();
  const title = `Restricted procedure ${fixture.suffix}`;
  let attachmentId: string;

  await test.step("Attach a real order marked do not perform", async () => {
    const membersResponse = await request.get(
      `${apiBaseUrl()}/api/v1/facility/${fixture.facilityId}/users/?limit=1`,
      { headers },
    );
    expect(membersResponse.ok(), await membersResponse.text()).toBeTruthy();
    const members = (await membersResponse.json()) as {
      results: { id: string }[];
    };
    expect(members.results.length).toBeGreaterThan(0);
    const codesResponse = await request.post(
      `${apiBaseUrl()}/api/v1/valueset/expand_slug/`,
      {
        headers,
        data: {
          slug: "activity-definition-procedure-code",
          search: "",
          count: 1,
        },
      },
    );
    expect(codesResponse.ok(), await codesResponse.text()).toBeTruthy();
    const codes = (await codesResponse.json()) as {
      results: { code: string; system: string; display: string }[];
    };
    expect(codes.results.length).toBeGreaterThan(0);
    const { code, system, display } = codes.results[0];
    const orderResponse = await request.post(
      `${apiBaseUrl()}/api/v1/facility/${fixture.facilityId}/service_request/`,
      {
        headers,
        data: {
          title,
          encounter: fixture.encounterId,
          status: "active",
          intent: "order",
          priority: "routine",
          category: "laboratory",
          do_not_perform: true,
          code: { code, system, display },
          requester: members.results[0].id,
          locations: [],
        },
      },
    );
    expect(orderResponse.ok(), await orderResponse.text()).toBeTruthy();
    const order = (await orderResponse.json()) as { id: string };
    const attachmentResponse = await request.post(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      {
        headers,
        data: {
          resource_type: "service_request",
          resource_id: order.id,
          attachment_type: "source",
        },
      },
    );
    expect(
      attachmentResponse.ok(),
      await attachmentResponse.text(),
    ).toBeTruthy();
    attachmentId = (await attachmentResponse.json()).id;
  });

  await test.step("Preserve the warning through delegated resolution and display it before order details", async () => {
    const resolved = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/${attachmentId}/resolve/`,
      { headers },
    );
    expect(resolved.ok(), await resolved.text()).toBeTruthy();
    expect(await resolved.json()).toMatchObject({
      resource_type: "service_request",
      resource: {
        title,
        do_not_perform: true,
        status: "active",
        intent: "order",
      },
    });
    await page.goto(fixture.path);
    const referralUrl = page.url();
    const preview = page
      .getByRole("region", { name: "Shared records", exact: true })
      .getByRole("region", { name: title, exact: true });
    await expect(preview.getByRole("alert")).toHaveText("Do not perform");
    await expect(page).toHaveURL(referralUrl);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
