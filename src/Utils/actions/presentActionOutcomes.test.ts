import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";

import { presentActionOutcomes } from "./presentActionOutcomes";

describe("action outcome notifications", () => {
  afterEach(() => mock.restoreAll());

  it("keeps every instruction visible in a scrollable summary, including the sixth", () => {
    const message = mock.method(toast, "message", () => "test-toast");
    presentActionOutcomes(
      Array.from({ length: 6 }, (_, index) => ({
        slug: "show_message",
        instruction_type: "NOTIFY",
        results: { message: `Instruction ${index + 1}` },
      })),
    );
    assert.equal(message.mock.callCount(), 1);
    const options = message.mock.calls[0].arguments[1] as {
      description: ReactNode;
    };
    const html = renderToStaticMarkup(options.description);
    for (let index = 1; index <= 6; index++)
      assert.ok(html.includes(`Instruction ${index}`));
    assert.ok(html.includes("overflow-y-auto"));
  });
});
