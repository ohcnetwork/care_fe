import { expect, test } from "@playwright/test";
import {
  atPath,
  expectHistoryIndex,
  navigateInApp,
} from "tests/helper/history";
import { createReferralFixture } from "tests/helper/referrals";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Back from referral pages", () => {
  test("a referral opened from the patient's referrals goes back there", async ({
    page,
    request,
  }) => {
    const fixture = await createReferralFixture(request);
    const referralsPath = `/facility/${fixture.facilityId}/patient/${fixture.patientId}/referrals`;

    await page.goto(referralsPath);
    await page.getByRole("link", { name: fixture.title }).first().click();
    await expect(page).toHaveURL(new RegExp(`${fixture.path}\\?sourceUrl=`));
    await expectHistoryIndex(page, 1);

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(atPath(referralsPath));
    await expectHistoryIndex(page, 0);
  });

  test("a referral opened directly replaces itself with its source", async ({
    page,
    request,
  }) => {
    const fixture = await createReferralFixture(request);
    const referralsPath = `/facility/${fixture.facilityId}/patient/${fixture.patientId}/referrals`;

    await page.goto(
      `${fixture.path}?${new URLSearchParams({ sourceUrl: referralsPath })}`,
    );
    await expectHistoryIndex(page, 0);

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(atPath(referralsPath));
    await expectHistoryIndex(page, 0);
  });

  test("closing the response page replaces it with the referral", async ({
    page,
    request,
  }) => {
    const fixture = await createReferralFixture(request);

    await page.goto(fixture.path);
    await navigateInApp(page, `${fixture.path}/respond`);
    await expect(page).toHaveURL(`${fixture.path}/respond`);
    await expectHistoryIndex(page, 1);

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(fixture.path);
    await expectHistoryIndex(page, 1);

    // The response page is gone from history: going back cannot reopen it.
    await page.goBack();
    await expect(page).toHaveURL(fixture.path);
    await expectHistoryIndex(page, 0);
  });
});
