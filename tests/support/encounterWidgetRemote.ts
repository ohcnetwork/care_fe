import type { Page } from "@playwright/test";

import type { PlugConfig } from "../../src/types/plugConfig";

/** A remote artifact served through the real federation loader, without a host registry seam. */
export async function installEncounterWidgetRemote(
  page: Page,
  { holdLazyModule = false, holdManifest = false } = {},
) {
  const slug = "care_workspace_fixture";
  const baseUrl = `https://encounter-widgets.test/${slug}/`;
  const config: PlugConfig = {
    slug,
    meta: {
      url: `${baseUrl}remoteEntry.js`,
      name: "Remote clinical review",
    },
  };
  let releaseLazyModule = () => {};
  const lazyModuleReady = new Promise<void>((resolve) => {
    releaseLazyModule = resolve;
  });
  let notifyLazyRequest = () => {};
  const lazyModuleRequested = new Promise<void>((resolve) => {
    notifyLazyRequest = resolve;
  });
  if (!holdLazyModule) releaseLazyModule();

  let releaseManifest = () => {};
  const manifestReady = new Promise<void>((resolve) => {
    releaseManifest = resolve;
  });
  if (!holdManifest) releaseManifest();

  await page.route(`${baseUrl}*`, async (route) => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1);
    let body: string;
    if (file === "remoteEntry.js") {
      await manifestReady;
      // This is the Vite federation container contract: init receives the
      // host share scope, and get returns a factory for the exposed module.
      body = `
        let shareScope;
        export function init(scope) { shareScope = scope; }
        export async function get(name) {
          if (name !== "./manifest") throw new Error("Unknown exposed module");
          const provider = Object.values(shareScope.react)[0];
          const sharedReact = await (await provider.get())();
          const React = Object.assign({}, sharedReact.default, sharedReact);
          const Review = React.lazy(() => import("./review.js").then(module => ({
            default: module.createReview(React),
          })));
          const LabResults = React.lazy(() => Promise.resolve({
            default: () => React.createElement("p", null, "Registered plugin page"),
          }));
          function Unstable({ encounter, config }) {
            if (Object.keys(config).length !== 0) {
              throw new Error("Unexpected default widget configuration");
            }
            if (encounter.status === "in_progress") {
              throw new Error("Remote widget failed for this encounter");
            }
            return React.createElement("p", null, "Historical plugin recovered");
          }
          return () => ({
            __esModule: true,
            default: {
              plugin: "Untrusted display name",
              slug: "wrong_namespace",
              encounterWidgets: { review: Review, unstable: Unstable },
              encounterTabs: { "lab.results": LabResults },
            },
          });
        }
      `;
    } else if (file === "review.js") {
      notifyLazyRequest();
      await lazyModuleReady;
      body = `
        export function createReview(React) {
          const h = React.createElement;
          return function Review({ patientId, encounterId, encounter,
            facilityId, title, config, readOnly }) {
            const [reviewCount, setReviewCount] = React.useState(0);
            const [record, setRecord] = React.useState("");
            React.useEffect(() => {
              let active = true;
              fetch("/api/v1/patient/" + patientId + "/symptom/?encounter=" + encounterId)
                .then(response => response.json())
                .then(data => { if (active) setRecord(data.results[0]?.code.display ?? ""); });
              return () => { active = false; };
            }, [patientId, encounterId]);
            return h("section", { "aria-label": title ?? "Remote review" },
              h("h2", null, title ?? "Remote review"),
              h("p", null, config.caption),
              h("p", null, "Patient: " + patientId),
              h("p", null, "Facility: " + facilityId),
              h("p", null, "Encounter: " + encounterId),
              h("p", null, "Selected record: " + encounter.id + " / " + encounter.status),
              h("p", null, "Plugin record: " + record),
              h("p", null, readOnly ? "Read only review" : "Editable review"),
              h("button", {
                disabled: readOnly,
                onClick: () => setReviewCount(count => count + 1),
              }, "Reviewed " + reviewCount),
            );
          };
        }
      `;
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({
      contentType: "application/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
      body,
    });
  });

  return { config, lazyModuleRequested, releaseLazyModule, releaseManifest };
}
