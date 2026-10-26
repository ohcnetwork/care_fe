import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const routesDirectory = new URL("../src/Routers/routes/", import.meta.url);

for (const filename of readdirSync(routesDirectory)) {
  if (!filename.endsWith(".tsx")) continue;

  test(`${filename} loads page components only through module-level lazy imports`, () => {
    const source = ts.createSourceFile(
      filename,
      readFileSync(new URL(filename, routesDirectory), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let lazyPages = 0;

    for (const statement of source.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        !statement.importClause?.isTypeOnly
      ) {
        const path = statement.moduleSpecifier.text;
        assert.ok(
          !path.startsWith("@/pages/") &&
            (!path.startsWith("@/components/") ||
              path === "@/components/Patient/PatientDetailsTab"),
          `Page imported eagerly: ${path}`,
        );
      }

      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        if (
          initializer &&
          ts.isCallExpression(initializer) &&
          initializer.expression.getText(source) === "lazy"
        ) {
          assert.match(initializer.getText(source), /import\(["']@\//);
          lazyPages++;
        }
      }
    }

    assert.ok(
      lazyPages > 0,
      "Route components must have stable lazy boundaries",
    );
  });
}

test("React Flow styles are scoped to the location map", () => {
  const entry = readFileSync(
    new URL("../src/index.tsx", import.meta.url),
    "utf8",
  );
  const map = readFileSync(
    new URL(
      "../src/pages/Facility/settings/locations/LocationMap.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.ok(!entry.includes("reactflow/dist/style.css"));
  assert.ok(map.includes('import "reactflow/dist/style.css"'));
});
