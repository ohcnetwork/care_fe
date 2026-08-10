import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import { FileCategory, FileType } from "@/types/files/file";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { FileUploadRow } from "./model";
import {
  makeToRequests,
  newFileRow,
  projectValues,
  unnamedFileRowIds,
} from "./model";

const CTX = { encounterId: "enc-1", questionId: "q-1" } as const;

/** Node 20+ ships a global `File` constructor (part of the platform's
 *  `File`/`Blob` API, unlike `FileReader`, which stays DOM-only) — no jsdom
 *  or polyfill needed for these fixtures. Do not add one. */
function fixtureFile(name = "scan.pdf", type = "application/pdf"): File {
  return new File(["contents"], name, { type });
}

function row(overrides: Partial<FileUploadRow> = {}): FileUploadRow {
  return { ...newFileRow(fixtureFile(), "enc-1"), ...overrides };
}

function add(
  rowId: string,
  patch: FileUploadRow,
): StructuredEdit<FileUploadRow> {
  return { rowId, op: "add", patch };
}

/**
 * A Node-safe stand-in for the real `readFileAsDataURL` (`@/Utils/utils`),
 * which this suite never imports — see `model.ts`'s `FileRequestDeps` doc
 * comment for why `makeToRequests` takes it as a parameter instead of
 * `toRequests` importing it directly. Records every `File` it was asked to
 * read so a test can assert the reader was (or, more importantly, was NOT)
 * invoked at all.
 */
function fakeReader(base64ByName: Record<string, string> = {}) {
  const calls: File[] = [];
  const readFileAsDataURL = async (file: File): Promise<string> => {
    calls.push(file);
    const encoded = base64ByName[file.name] ?? "ZmFrZQ==";
    return `data:${file.type || "application/octet-stream"};base64,${encoded}`;
  };
  return { readFileAsDataURL, calls };
}

describe("files model", () => {
  describe("newFileRow", () => {
    it("seeds name '' (the clinician has to type it), original_name from the File, the fixed type/category, the encounter, and carries the SAME File reference", () => {
      const file = fixtureFile("x-ray.png");
      const created = newFileRow(file, "enc-42");

      assert.deepEqual(created, {
        name: "",
        file_data: file,
        original_name: "x-ray.png",
        file_type: FileType.ENCOUNTER,
        file_category: FileCategory.UNSPECIFIED,
        associating_id: "enc-42",
      });
      // Reference identity, not merely deep-equal content — this is the
      // ONE place the picked `File` lives between pick and submit; a copy
      // here would defeat that single-source-of-truth claim even though a
      // `deepEqual` check alone couldn't tell the difference.
      assert.equal(created.file_data, file);
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one files entry, in order, without aliasing the input array", () => {
      const rowA = newFileRow(fixtureFile("a.pdf"), "enc-1");
      const rowB = newFileRow(fixtureFile("b.pdf"), "enc-1");
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [{ type: "files", value: [rowA, rowB] }]);
      assert.notEqual(
        (projected[0] as { type: "files"; value: FileUploadRow[] }).value,
        rows,
      );
    });

    it("projects an UNNAMED row too — the required-name gate is validate()'s job, not projectValues'; see the name decision below", () => {
      const unnamed = row({ name: "" });
      assert.deepEqual(projectValues([unnamed]), [
        { type: "files", value: [unnamed] },
      ]);
    });
  });

  describe("unnamedFileRowIds — the name decision", () => {
    for (const name of ["", "   "]) {
      it(`flags name ${JSON.stringify(name)} as unnamed`, () => {
        assert.deepEqual(unnamedFileRowIds([add("row-a", row({ name }))]), [
          "row-a",
        ]);
      });
    }

    it("flags a row with no `name` key at all (a malformed/restored patch)", () => {
      const { name: _name, ...withoutName } = row();
      assert.deepEqual(
        unnamedFileRowIds([
          add("row-a", withoutName as unknown as FileUploadRow),
        ]),
        ["row-a"],
      );
    });

    it("does not flag a named row", () => {
      assert.deepEqual(
        unnamedFileRowIds([add("row-a", row({ name: "Chest X-Ray" }))]),
        [],
      );
    });

    it("never reports a remove edit, regardless of its name", () => {
      const removed: StructuredEdit<FileUploadRow> = {
        rowId: "row-a",
        op: "remove",
        patch: row({ name: "" }),
      };
      assert.deepEqual(unnamedFileRowIds([removed]), []);
    });

    it("returns rowIds in log order", () => {
      const edits = [
        add("row-a", row({ name: "" })),
        add("row-b", row({ name: "Named" })),
        add("row-c", row({ name: "   " })),
      ];
      assert.deepEqual(unnamedFileRowIds(edits), ["row-a", "row-c"]);
    });
  });

  describe("makeToRequests", () => {
    it("an empty edit log produces ZERO requests, and never calls the reader", async () => {
      const { readFileAsDataURL, calls } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });

      assert.deepEqual(await toRequests([], CTX), []);
      assert.equal(calls.length, 0);
    });

    it("two adds compile TWO POSTs — one per file, in log order — each with base64 file_data (the data: prefix stripped) and the encounter injected", async () => {
      const fileA = fixtureFile("a.pdf");
      const fileB = fixtureFile("b.png", "image/png");
      const rowA = { ...newFileRow(fileA, "enc-1"), name: "A" };
      const rowB = { ...newFileRow(fileB, "enc-1"), name: "B" };
      const { readFileAsDataURL } = fakeReader({
        "a.pdf": "QQ==",
        "b.png": "Qg==",
      });
      const toRequests = makeToRequests({ readFileAsDataURL });

      const requests = await toRequests(
        [add("row-a", rowA), add("row-b", rowB)],
        CTX,
      );

      assert.deepEqual(requests, [
        {
          url: "/api/v1/files/upload-file/",
          method: "POST",
          body: { ...rowA, file_data: "QQ==", encounter: "enc-1" },
          reference_id: "structured:files:q-1",
        },
        {
          url: "/api/v1/files/upload-file/",
          method: "POST",
          body: { ...rowB, file_data: "Qg==", encounter: "enc-1" },
          reference_id: "structured:files:q-1",
        },
      ]);
    });

    it("sends nothing without an encounter in context, and never calls the reader", async () => {
      const { readFileAsDataURL, calls } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });
      const created = newFileRow(fixtureFile(), "enc-1");

      assert.deepEqual(
        await toRequests([add("row-a", created)], { questionId: "q-1" }),
        [],
      );
      assert.equal(calls.length, 0);
    });

    it("a removed row does not reach requests — built through the REAL reducer, not a hand-written log", async () => {
      const { readFileAsDataURL, calls } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });
      const created = newFileRow(fixtureFile(), "enc-1");

      let log = applyEditToLog<FileUploadRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<FileUploadRow>(log, {
        rowId: "row-a",
        op: "remove",
        patch: created,
      });
      // add -> remove for the same rowId annihilates: the row never
      // reached the server, so the log returns to pristine.
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
      assert.equal(calls.length, 0);
    });

    it("ignores a stray remove op with no matching add — there is no delete endpoint for an uploaded file", async () => {
      const { readFileAsDataURL, calls } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });
      const stray: StructuredEdit<FileUploadRow> = {
        rowId: "row-a",
        op: "remove",
        patch: newFileRow(fixtureFile(), "enc-1"),
      };

      assert.deepEqual(await toRequests([stray], CTX), []);
      assert.equal(calls.length, 0);
    });

    it("a corrupted 'update' op — never a legitimate op for this create-only type — never reaches the request body", async () => {
      const { readFileAsDataURL, calls } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });
      const corrupted: StructuredEdit<FileUploadRow> = {
        rowId: "row-a",
        op: "update",
        patch: newFileRow(fixtureFile(), "enc-1"),
      };

      assert.deepEqual(await toRequests([corrupted], CTX), []);
      assert.equal(calls.length, 0);
    });
  });

  describe("the name decision — validate() gates the submit, toRequests does not re-check it", () => {
    it("toRequests still compiles a request for an unnamed row: the differ trusts that a blocking validate() error already stopped the submit before toRequests could ever run", async () => {
      const bad = row({ name: "" });
      const edits = [add("row-a", bad)];
      assert.deepEqual(unnamedFileRowIds(edits), ["row-a"]);

      const { readFileAsDataURL } = fakeReader();
      const toRequests = makeToRequests({ readFileAsDataURL });
      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      assert.deepEqual((requests[0].body as { name: string }).name, "");
    });

    it("projectValues shows the very same unnamed row toRequests would submit — the two agree even here", () => {
      const bad = row({ name: "" });
      assert.deepEqual(projectValues([bad]), [{ type: "files", value: [bad] }]);
    });
  });
});
