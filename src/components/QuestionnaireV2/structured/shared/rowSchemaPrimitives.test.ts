import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dateOnlyString,
  displayObjectSchema,
  isoInstantString,
  nonEmptyString,
  onsetSchema,
  periodSchema,
  userDisplaySchema,
} from "./rowSchemaPrimitives";

describe("dateOnlyString", () => {
  it("accepts a real calendar date", () => {
    assert.equal(dateOnlyString.safeParse("2024-06-15").success, true);
  });

  it("accepts a leap-year Feb 29", () => {
    assert.equal(dateOnlyString.safeParse("2024-02-29").success, true);
  });

  it("rejects a non-leap-year Feb 29", () => {
    assert.equal(dateOnlyString.safeParse("2023-02-29").success, false);
  });

  it("rejects a rollover date (Feb 31 does not become March 2 silently)", () => {
    assert.equal(dateOnlyString.safeParse("2024-02-31").success, false);
  });

  it("rejects a 2-digit year", () => {
    assert.equal(dateOnlyString.safeParse("24-06-15").success, false);
  });

  it("rejects a US-format date", () => {
    assert.equal(dateOnlyString.safeParse("06/15/2024").success, false);
  });

  it("rejects an empty string", () => {
    assert.equal(dateOnlyString.safeParse("").success, false);
  });

  it("rejects a full ISO datetime (not date-only)", () => {
    assert.equal(
      dateOnlyString.safeParse("2024-06-15T00:00:00Z").success,
      false,
    );
  });
});

describe("isoInstantString", () => {
  it("accepts a full ISO instant", () => {
    assert.equal(
      isoInstantString.safeParse("2024-06-15T10:30:00.000Z").success,
      true,
    );
  });

  it("accepts a bare date string (Date.parse resolves it)", () => {
    assert.equal(isoInstantString.safeParse("2024-06-15").success, true);
  });

  it("rejects an empty string", () => {
    assert.equal(isoInstantString.safeParse("").success, false);
  });

  it("rejects whitespace-only", () => {
    assert.equal(isoInstantString.safeParse("   ").success, false);
  });

  it("rejects unparseable garbage", () => {
    assert.equal(isoInstantString.safeParse("not-a-date").success, false);
  });
});

describe("nonEmptyString", () => {
  it("accepts a non-blank string", () => {
    assert.equal(nonEmptyString.safeParse("hello").success, true);
  });

  it("rejects an empty string", () => {
    assert.equal(nonEmptyString.safeParse("").success, false);
  });
});

describe("displayObjectSchema", () => {
  it("accepts an object with id + the named required keys, extra fields passed through", () => {
    const schema = displayObjectSchema(["slug", "title"]);
    const result = schema.safeParse({
      id: "def-1",
      slug: "cbc-panel",
      title: "Complete Blood Count",
      price_components: [{ irrelevant: "shape" }],
    });
    assert.equal(result.success, true);
  });

  it("rejects a missing id", () => {
    const schema = displayObjectSchema(["slug"]);
    assert.equal(schema.safeParse({ slug: "cbc-panel" }).success, false);
  });

  it("rejects a missing named required key", () => {
    const schema = displayObjectSchema(["slug", "title"]);
    assert.equal(
      schema.safeParse({ id: "def-1", slug: "cbc-panel" }).success,
      false,
    );
  });

  it("with no extra keys, only requires id", () => {
    const schema = displayObjectSchema();
    assert.equal(
      schema.safeParse({ id: "u-1", anything: "goes" }).success,
      true,
    );
  });
});

describe("userDisplaySchema", () => {
  it("accepts a minimal user display object, extra real API fields passed through", () => {
    assert.equal(
      userDisplaySchema.safeParse({
        id: "user-1",
        username: "care-doctor",
        first_name: "Care",
        last_name: "Doctor",
      }).success,
      true,
    );
  });

  it("rejects a missing username", () => {
    assert.equal(userDisplaySchema.safeParse({ id: "user-1" }).success, false);
  });
});

describe("onsetSchema", () => {
  it("accepts a fully populated onset", () => {
    assert.equal(
      onsetSchema.safeParse({
        onset_datetime: "2026-01-15",
        onset_age: "34",
        onset_string: "since childhood",
        note: "note",
      }).success,
      true,
    );
  });

  it("accepts an empty onset object (every field optional)", () => {
    assert.equal(onsetSchema.safeParse({}).success, true);
  });

  it("rejects a malformed onset_datetime", () => {
    assert.equal(
      onsetSchema.safeParse({ onset_datetime: "2024-02-31" }).success,
      false,
    );
  });

  it("rejects an unknown key", () => {
    assert.equal(onsetSchema.safeParse({ made_up_field: true }).success, false);
  });
});

describe("periodSchema", () => {
  it("accepts a fully populated period", () => {
    assert.equal(
      periodSchema.safeParse({
        start: "2026-01-01T00:00:00.000Z",
        end: "2026-01-10T00:00:00.000Z",
      }).success,
      true,
    );
  });

  it("accepts an empty period (both ends optional)", () => {
    assert.equal(periodSchema.safeParse({}).success, true);
  });

  it("rejects an unparseable start", () => {
    assert.equal(
      periodSchema.safeParse({ start: "not-a-date" }).success,
      false,
    );
  });

  it("rejects an unknown key", () => {
    assert.equal(periodSchema.safeParse({ middle: "x" }).success, false);
  });
});
