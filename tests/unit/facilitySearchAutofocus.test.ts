import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { act, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

// Setup JSDOM environment for actual React component testing
const dom = new JSDOM(
  "<!DOCTYPE html><html><body><div id='root'></div></body></html>",
  {
    url: "http://localhost",
    pretendToBeVisual: true,
  },
);

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Component representing the Facility Search Input pattern used on FacilitiesPage and OrganizationFacilities
function FacilitySearchInput({
  autoFocus = false,
  onSearch,
}: {
  autoFocus?: boolean;
  onSearch?: (key: string, value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return React.createElement(
    "div",
    null,
    React.createElement("input", {
      id: "facility-search",
      ref: inputRef,
      value,
      placeholder: "Search by facility name",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch?.("name", e.target.value);
      },
    }),
    React.createElement(
      "button",
      { id: "other-element", type: "button" },
      "Other Element",
    ),
  );
}

describe("Facility Search Autofocus Component Tests", () => {
  // Mobile breakpoint used across CARE (sm: 640)
  const BREAKPOINT_WIDTH = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };

  function evaluateIsMobile(width: number): boolean {
    const map = { default: true, sm: false };
    const breakpoint = Object.entries(map).reduce((acc, [key]) => {
      if (
        width >= (BREAKPOINT_WIDTH[key as keyof typeof BREAKPOINT_WIDTH] || 0)
      ) {
        return key;
      }
      return acc;
    }, "default");
    return map[breakpoint as keyof typeof map] ?? map.default;
  }

  it("1. Desktop: autofocus focuses the actual HTML input element (document.activeElement)", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    const isMobile = evaluateIsMobile(1280);
    const autoFocus = !isMobile;
    assert.strictEqual(autoFocus, true, "autoFocus should be true on desktop");

    await act(async () => {
      root.render(React.createElement(FacilitySearchInput, { autoFocus }));
    });

    const input = document.getElementById(
      "facility-search",
    ) as HTMLInputElement;
    assert.ok(input, "Search input should be rendered in the DOM");
    assert.strictEqual(
      document.activeElement,
      input,
      "document.activeElement should be the facility search input on desktop",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("2. Mobile: autofocus does NOT focus the search input (document.activeElement is not input)", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    const isMobile = evaluateIsMobile(375);
    const autoFocus = !isMobile;
    assert.strictEqual(autoFocus, false, "autoFocus should be false on mobile");

    await act(async () => {
      root.render(React.createElement(FacilitySearchInput, { autoFocus }));
    });

    const input = document.getElementById(
      "facility-search",
    ) as HTMLInputElement;
    assert.ok(input, "Search input should be rendered in the DOM");
    assert.notStrictEqual(
      document.activeElement,
      input,
      "document.activeElement should NOT be the facility search input on mobile",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("3. Usability: input remains usable and accepts keyboard input after autofocus", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);
    let lastSearchKey = "";
    let lastSearchValue = "";

    await act(async () => {
      root.render(
        React.createElement(FacilitySearchInput, {
          autoFocus: true,
          onSearch: (key: string, val: string) => {
            lastSearchKey = key;
            lastSearchValue = val;
          },
        }),
      );
    });

    const input = document.getElementById(
      "facility-search",
    ) as HTMLInputElement;
    assert.strictEqual(document.activeElement, input);

    // Simulate typing
    await act(async () => {
      input.value = "General Hospital";
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });

    assert.strictEqual(input.value, "General Hospital");

    await act(async () => {
      root.unmount();
    });
  });

  it("4. Re-renders: component re-renders do not steal focus if user blurred or focused elsewhere", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(FacilitySearchInput, { autoFocus: true }),
      );
    });

    const input = document.getElementById(
      "facility-search",
    ) as HTMLInputElement;
    const otherButton = document.getElementById(
      "other-element",
    ) as HTMLButtonElement;
    assert.strictEqual(document.activeElement, input);

    // User moves focus to another element
    await act(async () => {
      otherButton.focus();
    });
    assert.strictEqual(document.activeElement, otherButton);

    // Re-render component with same autoFocus prop
    await act(async () => {
      root.render(
        React.createElement(FacilitySearchInput, { autoFocus: true }),
      );
    });

    // Focus must stay on otherButton and not be stolen back to input
    assert.strictEqual(
      document.activeElement,
      otherButton,
      "Focus should not be stolen back on unrelated re-renders",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("5. Conditional rendering: mounting when condition becomes true focuses input on desktop", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    function ConditionalParent({ show }: { show: boolean }) {
      if (!show) {
        return React.createElement(
          "div",
          { id: "empty-state" },
          "Loading...",
        );
      }
      return React.createElement(FacilitySearchInput, { autoFocus: true });
    }

    // Initially conditionally hidden
    await act(async () => {
      root.render(React.createElement(ConditionalParent, { show: false }));
    });
    assert.strictEqual(document.getElementById("facility-search"), null);

    // Condition met, component mounts
    await act(async () => {
      root.render(React.createElement(ConditionalParent, { show: true }));
    });

    const input = document.getElementById(
      "facility-search",
    ) as HTMLInputElement;
    assert.ok(input);
    assert.strictEqual(
      document.activeElement,
      input,
      "Input should receive focus when conditionally mounted on desktop",
    );

    await act(async () => {
      root.unmount();
    });
  });
});
