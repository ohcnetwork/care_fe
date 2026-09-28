import assert from "node:assert/strict";
import { test } from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import {
  FacilityOrganizationRead,
  FacilityOrganizationType,
} from "@/types/facilityOrganization/facilityOrganization";

import { useOrganizationSelection } from "./useOrganizationSelection";

function organization(id: string, name = id): FacilityOrganizationRead {
  return {
    id,
    name,
    description: "",
    org_type: FacilityOrganizationType.DEPT,
    active: true,
    level_cache: 0,
    has_children: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    permissions: [],
  };
}

test("organization selection follows controlled IDs without effects and preserves unresolved IDs", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previousGlobals = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const changes: {
    ids: string[] | null;
    records: FacilityOrganizationRead[];
  }[] = [];
  let selection: ReturnType<typeof useOrganizationSelection>;
  const current = () => selection;
  let renders = 0;
  function Harness(props: {
    value?: string[] | null;
    currentOrganizations?: FacilityOrganizationRead[];
    singleSelection?: boolean;
  }) {
    renders++;
    selection = useOrganizationSelection({
      ...props,
      singleSelection: props.singleSelection ?? false,
      onChange: (ids, records) => changes.push({ ids, records: records ?? [] }),
    });
    return null;
  }

  const root = createRoot(dom.window.document.getElementById("root")!);
  const first = organization("first");
  const second = organization("second");
  try {
    await act(async () =>
      root.render(createElement(Harness, { value: [first.id] })),
    );
    assert.deepEqual(current().selectedIds, [first.id]);
    assert.deepEqual(current().selectedOrganizations, []);
    await act(async () => current().selectOrganization(second));
    assert.deepEqual(changes.at(-1)?.ids, [first.id, second.id]);
    // An ID whose label has not arrived must not disappear from the next edit.
    assert.deepEqual(current().selectedIds, [first.id]);

    await act(async () =>
      root.render(
        createElement(Harness, {
          value: [first.id, second.id],
          currentOrganizations: [first],
        }),
      ),
    );
    assert.deepEqual(current().selectedOrganizations, [first, second]);
    const beforeProps = renders;
    await act(async () =>
      root.render(
        createElement(Harness, {
          value: [second.id, first.id],
          currentOrganizations: [first],
        }),
      ),
    );
    assert.equal(
      renders,
      beforeProps + 1,
      "selection changes need no synchronization render",
    );
    assert.deepEqual(current().selectedOrganizations, [second, first]);
    assert.equal(
      changes.length,
      1,
      "receiving props must not echo a change to the parent",
    );

    await act(async () => current().selectOrganization({ ...second }));
    assert.equal(
      changes.length,
      1,
      "duplicate detection uses IDs rather than object identity",
    );
    await act(async () => current().removeOrganization(second.id));
    assert.deepEqual(changes.at(-1)?.ids, [first.id]);

    const renamed = organization(first.id, "Updated department");
    await act(async () =>
      root.render(
        createElement(Harness, {
          value: [first.id],
          currentOrganizations: [renamed],
        }),
      ),
    );
    assert.equal(current().selectedOrganizations[0].name, renamed.name);
    await act(async () =>
      root.render(
        createElement(Harness, {
          value: [first.id],
          currentOrganizations: [],
        }),
      ),
    );
    assert.deepEqual(
      current().selectedOrganizations,
      [renamed],
      "a temporary metadata gap keeps the latest label and removable row",
    );
    await act(async () => root.render(createElement(Harness, { value: null })));
    assert.deepEqual(current().selectedOrganizations, []);
    assert.equal(
      changes.length,
      2,
      "external resets must not emit another change",
    );

    // Callers such as CareTeamSheet deliberately omit value.
    await act(async () =>
      root.render(createElement(Harness, { key: "uncontrolled" })),
    );
    await act(async () => current().selectOrganization(first));
    await act(async () => current().selectOrganization(second));
    assert.deepEqual(current().selectedIds, [first.id, second.id]);
    await act(async () => current().removeOrganization(first.id));
    assert.deepEqual(current().selectedOrganizations, [second]);
    await act(async () => current().removeOrganization(second.id));
    assert.deepEqual(current().selectedOrganizations, []);
    assert.equal(changes.at(-1)?.ids, null);

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: "single",
          singleSelection: true,
        }),
      ),
    );
    await act(async () => current().selectOrganization(first));
    await act(async () => current().selectOrganization(second));
    assert.deepEqual(current().selectedOrganizations, [second]);
    await act(async () => current().replaceSelection([first]));
    assert.deepEqual(current().selectedOrganizations, [first]);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
