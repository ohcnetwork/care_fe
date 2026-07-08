import { describe, expect, it } from "vitest";

import { scrubUrl } from "@/Integrations/Sentry";

describe("scrubUrl", () => {
  it("strips query strings", () => {
    expect(scrubUrl("/patients?phone_number=999")).toBe("/patients");
  });

  it("replaces UUID path segments", () => {
    expect(
      scrubUrl(
        "/facility/0198aaaa-1111-7bbb-8ccc-2ddddddddddd/patients/0198bbbb-2222-7ccc-8ddd-3eeeeeeeeeee/encounter",
      ),
    ).toBe("/facility/<id>/patients/<id>/encounter");
  });

  it("leaves non-sensitive urls intact", () => {
    expect(scrubUrl("/login")).toBe("/login");
  });
});
