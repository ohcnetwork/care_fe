import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function createReport() {
  const serviceRequestId = faker.string.uuid();
  return {
    id: faker.string.uuid(),
    status: "preliminary",
    code: { system: "test", code: "panel", display: faker.word.words(3) },
    category: { system: "test", code: "lab", display: "Laboratory" },
    conclusion: "",
    observations: [],
    created_by: {
      username: "reviewer",
      first_name: "Review",
      last_name: "Clinician",
      profile_picture_url: null,
    },
    updated_by: {
      username: "reviewer",
      first_name: "Review",
      last_name: "Clinician",
      profile_picture_url: null,
    },
    encounter: {
      id: getEncounterId(),
      patient: {
        id: getPatientId(),
        name: faker.person.fullName(),
        gender: "male",
        date_of_birth: "1990-01-01",
        instance_identifiers: [],
      },
    },
    service_request: { id: serviceRequestId, title: faker.word.words(3) },
    created_date: new Date().toISOString(),
    modified_date: new Date().toISOString(),
  };
}

function createFile(reportId: string) {
  return {
    id: faker.string.uuid(),
    name: faker.word.words(2),
    file_type: "diagnostic_report",
    associating_id: reportId,
    mime_type: "application/pdf",
    extension: "pdf",
    is_archived: false,
    upload_completed: true,
    created_date: new Date().toISOString(),
    uploaded_by: {
      username: "reviewer",
      first_name: "Review",
      last_name: "Clinician",
    },
  };
}

async function mockReviewPage(
  page: Page,
  report: ReturnType<typeof createReport>,
) {
  const facilityId = getFacilityId();
  const activity = {
    id: faker.string.uuid(),
    slug: faker.string.uuid(),
    title: faker.word.words(3),
    classification: "laboratory",
    diagnostic_report_codes: [report.code],
    specimen_requirements: [],
    observation_result_requirements: [],
  };
  let reportRequests = 0;
  const reportUrl = `**/api/v1/patient/${getPatientId()}/diagnostic_report/${report.id}/`;
  await page.route(reportUrl, (route) => {
    if (route.request().method() === "PUT") {
      Object.assign(report, route.request().postDataJSON());
    } else {
      reportRequests += 1;
    }
    return route.fulfill({ json: report });
  });
  await page.route(
    `**/api/v1/facility/${facilityId}/service_request/${report.service_request.id}/`,
    (route) =>
      route.fulfill({
        json: {
          id: report.service_request.id,
          title: activity.title,
          category: "laboratory",
          status: "active",
          intent: "order",
          priority: "routine",
          activity_definition: activity,
          encounter: report.encounter,
          diagnostic_reports: [report],
          specimens: [],
          locations: [],
        },
      }),
  );
  await page.route(
    `**/api/v1/facility/${facilityId}/activity_definition/${activity.slug}/`,
    (route) => route.fulfill({ json: activity }),
  );
  for (const resource of ["charge_item", "account"]) {
    await page.route(
      `**/api/v1/facility/${facilityId}/${resource}/?*`,
      (route) => route.fulfill({ json: { count: 0, results: [] } }),
    );
  }

  return {
    url: `/facility/${facilityId}/service_requests/${report.service_request.id}`,
    reportUrl,
    reportRequests: () => reportRequests,
    review: page.locator('[data-slot="collapsible"]').filter({
      has: page.getByRole("button", {
        name: new RegExp(`^(Expand|Collapse) ${report.code.display}$`),
      }),
    }),
  };
}

test.describe("Diagnostic report review", () => {
  test("requires report content and uses the edited conclusion for approval", async ({
    page,
  }) => {
    const report = createReport();
    const fixture = await mockReviewPage(page, report);
    let releaseFiles = () => {};
    const filesGate = new Promise<void>((resolve) => {
      releaseFiles = resolve;
    });
    await page.route("**/api/v1/files/?*", async (route) => {
      await filesGate;
      await route.fulfill({ json: { count: 0, results: [] } });
    });
    try {
      await page.goto(fixture.url);
      await page
        .getByRole("button", {
          name: `Expand ${report.code.display}`,
          exact: true,
        })
        .click();
      const approve = fixture.review.getByRole("button", {
        name: "Approve Results",
      });
      await expect(approve).toBeDisabled();
      releaseFiles();
      await expect(approve).toBeDisabled();

      const conclusion = fixture.review.getByRole("textbox", {
        name: "Conclusion",
        exact: true,
      });
      await conclusion.click();
      await fixture.review
        .getByRole("radio", { name: "Bulleted list", exact: true })
        .click();
      await expect(conclusion.getByRole("listitem")).toHaveCount(1);
      await expect(approve).toBeDisabled();
      await conclusion.press("Enter");
      await expect(conclusion.getByRole("listitem")).toHaveCount(0);
      const more = fixture.review.getByRole("button", {
        name: "More formatting options",
        exact: true,
      });
      await more.click();
      await fixture.review
        .getByRole("dialog", { name: "More formatting options", exact: true })
        .getByRole("radio", { name: "Check list", exact: true })
        .click();
      await more.press("Escape");
      await expect(conclusion.getByRole("checkbox")).toHaveCount(1);
      await expect(approve).toBeDisabled();
      await conclusion.press("Enter");
      await expect(conclusion.getByRole("checkbox")).toHaveCount(0);
      await conclusion.fill("Review conclusion without observations");
      await expect(approve).toBeEnabled();
      await conclusion.fill("   ");
      await expect(approve).toBeDisabled();
      await conclusion.fill("Final clinical conclusion");
      await conclusion.press("ControlOrMeta+a");
      await fixture.review
        .getByRole("radio", { name: "Bold", exact: true })
        .click();
      await conclusion.press("ArrowRight");
      await conclusion.press("Enter");
      await fixture.review
        .getByRole("radio", { name: "Remove bold", exact: true })
        .click();
      await fixture.review
        .getByRole("radio", { name: "Bulleted list", exact: true })
        .click();
      await conclusion.pressSequentially("First finding");
      await conclusion.press("Enter");
      await conclusion.pressSequentially("Second finding");
      await approve.click();
      const approvalRequest = page.waitForRequest(
        (request) =>
          request.method() === "PUT" && request.url().includes(report.id),
      );
      await page.getByRole("button", { name: "Approve", exact: true }).click();
      const savedReport = (await approvalRequest).postDataJSON();
      expect(savedReport.status).toBe("final");
      expect(savedReport.conclusion).toMatch(
        /\*\*Final clinical conclusion\*\*/,
      );
      expect(savedReport.conclusion).toMatch(
        /[-*] First finding\n[-*] Second finding/,
      );
      await expect(
        fixture.review.locator("strong", {
          hasText: "Final clinical conclusion",
        }),
      ).toBeVisible();
    } finally {
      releaseFiles();
    }
  });

  test("ignores archived and incomplete attachments when checking approval readiness", async ({
    page,
  }) => {
    const report = createReport();
    const fixture = await mockReviewPage(page, report);
    const completeFile = createFile(report.id);
    let files = [
      { ...createFile(report.id), is_archived: true },
      { ...createFile(report.id), upload_completed: false },
    ];
    let filesGate = Promise.resolve();
    await page.route("**/api/v1/files/?*", async (route) => {
      await filesGate;
      await route.fulfill({ json: { count: files.length, results: files } });
    });

    await page.goto(fixture.url);
    await page
      .getByRole("button", {
        name: `Expand ${report.code.display}`,
        exact: true,
      })
      .click();
    const approve = fixture.review.getByRole("button", {
      name: "Approve Results",
    });
    await expect(
      fixture.review
        .getByText(files[0].name + files[0].extension, { exact: true })
        .last(),
    ).toBeVisible();
    await expect(approve).toBeDisabled();

    files = [completeFile];
    await page
      .getByRole("button", {
        name: `Collapse ${report.code.display}`,
        exact: true,
      })
      .click();
    const fileResponse = page.waitForResponse("**/api/v1/files/?*");
    await page
      .getByRole("button", {
        name: `Expand ${report.code.display}`,
        exact: true,
      })
      .click();
    await fileResponse;
    await expect(approve).toBeEnabled();

    files = [];
    let releaseFiles = () => {};
    filesGate = new Promise<void>((resolve) => {
      releaseFiles = resolve;
    });
    try {
      await page
        .getByRole("button", {
          name: `Collapse ${report.code.display}`,
          exact: true,
        })
        .click();
      const pendingFiles = page.waitForRequest("**/api/v1/files/?*");
      await page
        .getByRole("button", {
          name: `Expand ${report.code.display}`,
          exact: true,
        })
        .click();
      await pendingFiles;
      await expect(approve).toBeDisabled();
      const emptyFiles = page.waitForResponse("**/api/v1/files/?*");
      releaseFiles();
      await emptyFiles;
      await expect(approve).toBeDisabled();
    } finally {
      releaseFiles();
    }
  });

  test("preserves a review draft across refetch and keeps conclusion editors independent", async ({
    page,
  }) => {
    const report = createReport();
    report.conclusion = "Saved conclusion";
    const fixture = await mockReviewPage(page, report);
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({ json: { count: 0, results: [] } }),
    );
    await page.goto(fixture.url);
    await page
      .getByRole("button", {
        name: `Expand ${report.code.display}`,
        exact: true,
      })
      .click();
    const conclusion = fixture.review.getByRole("textbox", {
      name: "Conclusion",
      exact: true,
    });
    await expect(conclusion).toHaveText("Saved conclusion");
    const entryConclusion = page
      .locator('[data-slot="collapsible"]')
      .filter({
        has: page.getByRole("button", { name: "Save Results", exact: true }),
      })
      .getByRole("textbox", { name: "Conclusion", exact: true });
    await expect(
      page.getByRole("textbox", { name: "Conclusion", exact: true }),
    ).toHaveCount(2);
    await expect(entryConclusion).toHaveText("Saved conclusion");
    await conclusion.fill("Unsaved review draft");
    await expect(entryConclusion).toHaveText("Saved conclusion");
    report.conclusion = "Saved by another reviewer";
    await page
      .getByRole("button", {
        name: `Collapse ${report.code.display}`,
        exact: true,
      })
      .click();
    const reportResponse = page.waitForResponse(fixture.reportUrl);
    await page
      .getByRole("button", {
        name: `Expand ${report.code.display}`,
        exact: true,
      })
      .click();
    await reportResponse;
    await expect(conclusion).toHaveText("Unsaved review draft");
    await expect(entryConclusion).toHaveText("Saved by another reviewer");
  });

  test("keeps mobile formatting on one row and preserves the draft through more options", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const report = createReport();
    const fixture = await mockReviewPage(page, report);
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({ json: { count: 0, results: [] } }),
    );
    await page.goto(fixture.url);
    await page
      .getByRole("button", {
        name: `Expand ${report.code.display}`,
        exact: true,
      })
      .click();
    const conclusion = fixture.review.getByRole("textbox", {
      name: "Conclusion",
      exact: true,
    });
    await conclusion.click();
    await conclusion.pressSequentially("Draft assessment");
    const toolbar = fixture.review.getByRole("toolbar");
    const more = toolbar.getByRole("button", {
      name: "More formatting options",
      exact: true,
    });
    await expect(more).toBeVisible();
    await expect(toolbar.locator("button:visible")).toHaveCount(6);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await toolbar.evaluate((element) => {
        const controls = Array.from(element.querySelectorAll("button")).filter(
          (control) => control.checkVisibility(),
        );
        const centers = controls.map((control) => {
          const rect = control.getBoundingClientRect();
          return rect.top + rect.height / 2;
        });
        return {
          rowHeightDifference: Math.max(...centers) - Math.min(...centers),
          hasHorizontalOverflow: element.scrollWidth > element.clientWidth,
          pageHasHorizontalOverflow:
            document.documentElement.scrollWidth > window.innerWidth,
        };
      });
      expect(
        geometry.rowHeightDifference,
        `Controls at ${width}px`,
      ).toBeLessThanOrEqual(1);
      expect(geometry.hasHorizontalOverflow, `Toolbar at ${width}px`).toBe(
        false,
      );
      expect(geometry.pageHasHorizontalOverflow, `Page at ${width}px`).toBe(
        false,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });

    await conclusion.press("ControlOrMeta+a");
    await more.click();
    const moreOptions = fixture.review.getByRole("dialog", {
      name: "More formatting options",
      exact: true,
    });
    await expect(
      moreOptions.getByRole("radio", { name: /^Undo / }),
    ).toBeEnabled();
    await moreOptions
      .getByRole("radio", { name: "Highlight", exact: true })
      .click();
    await more.press("Escape");
    await expect(moreOptions).not.toBeVisible();
    const blockType = toolbar.getByRole("combobox", {
      name: "Block type",
      exact: true,
    });
    await blockType.press("Space");
    await page
      .getByRole("option", { name: "Heading 2", exact: true })
      .press("Enter");
    await expect(
      conclusion.getByRole("heading", { name: "Draft assessment", level: 2 }),
    ).toBeVisible();
    await expect(
      conclusion
        .getByRole("heading", { name: "Draft assessment", level: 2 })
        .locator("mark"),
    ).toBeVisible();

    await conclusion.press("ControlOrMeta+a");
    await conclusion.press("ArrowRight");
    await conclusion.press("Enter");
    await conclusion.pressSequentially("Follow-up finding");
    await toolbar
      .getByRole("radio", { name: "Bulleted list", exact: true })
      .click();
    await more.click();
    await expect(
      moreOptions.getByRole("radio", { name: /^Undo / }),
    ).toBeEnabled();
    await more.press("Escape");
    await expect(conclusion.getByRole("listitem")).toHaveText([
      "Follow-up finding",
    ]);
    await expect(
      conclusion.getByRole("heading", { name: "Draft assessment", level: 2 }),
    ).toBeVisible();
    await expect(
      conclusion
        .getByRole("heading", { name: "Draft assessment", level: 2 })
        .locator("mark"),
    ).toBeVisible();
    await expect(
      fixture.review.getByRole("button", { name: "Approve Results" }),
    ).toBeEnabled();
  });

  test("loads final report details only after keyboard expansion and keeps attachments read-only", async ({
    page,
  }) => {
    const report = createReport();
    report.status = "final";
    report.conclusion =
      "## **Clinical interpretation**\n\n<u>Underlined detail</u> and ==Highlighted detail==\n\n- First finding\n- Second finding\n\n- [ ] Follow up\n- [x] Sample reviewed\n\nValues <left> and <medication> remain visible.";
    const fixture = await mockReviewPage(page, report);
    let fileRequests = 0;
    await page.route("**/api/v1/files/?*", (route) => {
      fileRequests += 1;
      return route.fulfill({
        json: { count: 1, results: [createFile(report.id)] },
      });
    });
    await page.goto(fixture.url);
    const toggle = page.getByRole("button", {
      name: `Expand ${report.code.display}`,
      exact: true,
    });
    await expect(toggle).toBeVisible();
    expect(fixture.reportRequests()).toBe(0);
    expect(fileRequests).toBe(0);
    await toggle.focus();
    await toggle.press("Enter");
    await expect(
      fixture.review.getByRole("link", { name: "Print Report" }),
    ).toBeVisible();
    await expect(
      fixture.review.getByRole("button", { name: "actions", exact: true }),
    ).toBeVisible();
    expect(fixture.reportRequests()).toBe(1);
    expect(fileRequests).toBe(1);
    await expect(
      fixture.review.locator("strong", { hasText: "Clinical interpretation" }),
    ).toBeVisible();
    await expect(fixture.review.getByRole("listitem")).toHaveText([
      "First finding",
      "Second finding",
      "Follow up",
      "Sample reviewed",
    ]);
    await expect(
      fixture.review.getByRole("heading", {
        name: "Clinical interpretation",
        level: 2,
      }),
    ).toBeVisible();
    await expect(
      fixture.review.locator("u", { hasText: "Underlined detail" }),
    ).toBeVisible();
    await expect(
      fixture.review.locator("mark", { hasText: "Highlighted detail" }),
    ).toBeVisible();
    const checkboxes = fixture.review.getByRole("checkbox");
    await expect(checkboxes).toHaveCount(2);
    await expect(checkboxes.nth(0)).toBeDisabled();
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await expect(checkboxes.nth(1)).toBeDisabled();
    await expect(checkboxes.nth(1)).toBeChecked();
    await expect(
      fixture.review.getByText(
        "Values <left> and <medication> remain visible.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      fixture.review.getByRole("textbox", { name: "Conclusion", exact: true }),
    ).toHaveCount(0);
    await fixture.review
      .getByRole("button", { name: "actions", exact: true })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Download", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Archive", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("menuitem", { name: "Rename", exact: true }),
    ).toHaveCount(0);
  });
});
