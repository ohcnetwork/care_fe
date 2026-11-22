import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";

// nginx/runtime-env.sh writes REACT_* values into a public script, so each
// value must stay a plain string, however hostile it is.
const SHIPPED = "window.__CARE_RUNTIME_ENV__ = {};\n";

function run(env: Record<string, string>) {
  const dir = mkdtempSync(path.join(tmpdir(), "runtime-env-"));
  const file = path.join(dir, "runtime-env.js");
  writeFileSync(file, SHIPPED);
  execFileSync("sh", ["nginx/runtime-env.sh"], {
    env: { PATH: process.env.PATH, CARE_RUNTIME_ENV_FILE: file, ...env },
    stdio: "pipe",
  });
  return readFileSync(file, "utf8");
}

function evaluate(code: string) {
  const window: { __CARE_RUNTIME_ENV__?: Record<string, string> } = {};
  vm.runInNewContext(code, { window });
  // Copied out of the VM context, whose objects have their own prototype.
  return { ...window.__CARE_RUNTIME_ENV__ };
}

test("REACT_* values round-trip exactly and can't break out", () => {
  const values = {
    REACT_QUOTES: `"double" 'single' \`back\``,
    REACT_BACKSLASHES: "C:\\path\\n\\u003c\\",
    REACT_CONTROL: "line 1\nline 2\r\n\ttabbed",
    REACT_SCRIPT_TAG: "</script><script>alert(1)</script>",
    REACT_BREAKOUT: '";alert(1);//',
    REACT_UNICODE: "മലയാളം ✓ \u2028\u2029",
    REACT_EMPTY: "",
  };

  const code = run({ ...values, NOT_REACT: "x", REACT_lower: "y" });

  assert.deepEqual(evaluate(code), values);
  assert.doesNotMatch(code, /<\/script/i);
});

test("leaves the file as it is without REACT_* variables", () => {
  assert.equal(run({ NOT_REACT: "x" }), SHIPPED);
});
