import fs from "fs";
import MagicString from "magic-string";
import path from "path";
import ts from "typescript";
import type { Plugin } from "vite";
import { normalizePath } from "vite";

const REGISTER_IMPORT = "@/lib/override";
const REGISTER_ALIAS = "__careRegisterComponent";

interface Edit {
  start: number;
  end: number;
  text: string;
}

interface TransformTarget {
  exportName: string;
  registeredName: string;
  isDefault: boolean;
}

interface ComponentTarget {
  name: string;
  file: string;
}

interface AutoRegisterComponentsOptions {
  include?: ReadonlySet<string> | null;
}

function shouldRegisterComponent(
  name: string,
  include: ReadonlySet<string> | null | undefined,
) {
  return !include || include.has(name);
}

function isPascalCase(name: string) {
  return /^[A-Z][A-Za-z0-9_]*$/.test(name);
}

function hasModifier(
  node: ts.Node,
  kind: ts.SyntaxKind.ExportKeyword | ts.SyntaxKind.DefaultKeyword,
) {
  return (
    (ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((modifier) => modifier.kind === kind)) ??
    false
  );
}

function containsJsx(node: ts.Node): boolean {
  let found = false;

  function visit(current: ts.Node) {
    if (found) {
      return;
    }

    switch (current.kind) {
      case ts.SyntaxKind.JsxElement:
      case ts.SyntaxKind.JsxSelfClosingElement:
      case ts.SyntaxKind.JsxFragment:
        found = true;
        return;
      default:
        ts.forEachChild(current, visit);
    }
  }

  visit(node);
  return found;
}

function isComponentFunction(node: ts.FunctionDeclaration) {
  return !!node.body && containsJsx(node.body);
}

function isRefOrMemoCall(node: ts.CallExpression): boolean {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) {
    return callee.text === "forwardRef" || callee.text === "memo";
  }
  if (ts.isPropertyAccessExpression(callee)) {
    return callee.name.text === "forwardRef" || callee.name.text === "memo";
  }
  return false;
}

function isComponentInitializer(node: ts.Expression | undefined): boolean {
  if (!node) {
    return false;
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return containsJsx(node.body);
  }

  if (ts.isCallExpression(node)) {
    if (isRefOrMemoCall(node)) {
      return false;
    }
    return containsJsx(node);
  }

  return false;
}

function uniqueName(source: string, preferred: string) {
  let name = preferred;
  let index = 2;

  while (new RegExp(`\\b${name}\\b`).test(source)) {
    name = `${preferred}${index}`;
    index += 1;
  }

  return name;
}

function removeExportAndDefaultModifiers(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  edits: Edit[],
) {
  if (!ts.canHaveModifiers(node)) {
    return;
  }

  for (const modifier of ts.getModifiers(node) ?? []) {
    if (
      modifier.kind !== ts.SyntaxKind.ExportKeyword &&
      modifier.kind !== ts.SyntaxKind.DefaultKeyword
    ) {
      continue;
    }

    let end = modifier.end;
    while (/\s/.test(sourceFile.text[end] ?? "")) {
      end += 1;
    }

    edits.push({ start: modifier.getStart(sourceFile), end, text: "" });
  }
}

function appendRegistration(target: TransformTarget) {
  const registration = `${REGISTER_ALIAS}(${JSON.stringify(
    target.exportName,
  )}, ${target.exportName})`;
  const declaration = `\nconst ${target.registeredName} = ${registration};`;

  if (target.isDefault) {
    return `${declaration}\nexport default ${target.registeredName};`;
  }

  return `${declaration}\nexport { ${target.registeredName} as ${target.exportName} };`;
}

function applyEdits(source: string, id: string, edits: Edit[]) {
  const code = new MagicString(source, { filename: id });

  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    if (edit.start === edit.end) {
      code.appendLeft(edit.start, edit.text);
      continue;
    }

    if (edit.text === "") {
      code.remove(edit.start, edit.end);
      continue;
    }

    code.update(edit.start, edit.end, edit.text);
  }

  return {
    code: code.toString(),
    map: code.generateMap({
      hires: true,
      includeContent: true,
      source: id,
    }),
  };
}

function getImportInsertPosition(sourceFile: ts.SourceFile) {
  let position = 0;

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      position = statement.end;
      continue;
    }

    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression)
    ) {
      position = statement.end;
      continue;
    }

    break;
  }

  return position;
}

function createRegisterImport(sourceFile: ts.SourceFile) {
  const insertPosition = getImportInsertPosition(sourceFile);
  const prefix = insertPosition > 0 ? "\n" : "";

  return {
    start: insertPosition,
    end: insertPosition,
    text: `${prefix}import { register as ${REGISTER_ALIAS} } from "${REGISTER_IMPORT}";\n`,
  };
}

function findLocalComponentDeclaration(
  sourceFile: ts.SourceFile,
  name: string,
): ts.FunctionDeclaration | ts.VariableDeclaration | null {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      return isComponentFunction(statement) ? statement : null;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          !ts.isIdentifier(declaration.name) ||
          declaration.name.text !== name
        ) {
          continue;
        }

        return isComponentInitializer(declaration.initializer)
          ? declaration
          : null;
      }
    }
  }

  return null;
}

function collectComponentTargets(
  source: string,
  id: string,
): ComponentTarget[] {
  const sourceFile = ts.createSourceFile(
    id,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const targets: ComponentTarget[] = [];
  const localComponents = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isPascalCase(statement.name.text) &&
      isComponentFunction(statement)
    ) {
      localComponents.add(statement.name.text);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          isPascalCase(declaration.name.text) &&
          isComponentInitializer(declaration.initializer)
        ) {
          localComponents.add(declaration.name.text);
        }
      }
    }
  }

  for (const statement of sourceFile.statements) {
    const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);

    if (
      isExported &&
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      localComponents.has(statement.name.text)
    ) {
      targets.push({ name: statement.name.text, file: id });
      continue;
    }

    if (
      isExported &&
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length === 1
    ) {
      const declaration = statement.declarationList.declarations[0];

      if (
        ts.isIdentifier(declaration.name) &&
        localComponents.has(declaration.name.text)
      ) {
        targets.push({ name: declaration.name.text, file: id });
      }

      continue;
    }

    if (
      ts.isExportAssignment(statement) &&
      ts.isIdentifier(statement.expression) &&
      localComponents.has(statement.expression.text)
    ) {
      targets.push({ name: statement.expression.text, file: id });
    }
  }

  return targets;
}

export function collectUnsupportedComponentTargets(
  source: string,
  id: string,
): ComponentTarget[] {
  const sourceFile = ts.createSourceFile(
    id,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const unsupported: ComponentTarget[] = [];

  for (const statement of sourceFile.statements) {
    // export { Foo } / export { X as Y } / export { Foo } from "./x" (re-exports)
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const specifier of statement.exportClause.elements) {
        const exportedName = specifier.name.text; // Y in "X as Y", Foo in "{ Foo }"
        if (isPascalCase(exportedName)) {
          unsupported.push({ name: exportedName, file: id });
        }
      }
      continue;
    }

    // multi-declarator: export const A = ..., B = ...
    if (
      hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length > 1
    ) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          isPascalCase(declaration.name.text)
        ) {
          unsupported.push({ name: declaration.name.text, file: id });
        }
      }
    }
  }

  return unsupported;
}

function findTsxFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return findTsxFiles(filePath);
    }

    return entry.isFile() && filePath.endsWith(".tsx") ? [filePath] : [];
  });
}

function collectRegisteredComponentTargets(
  srcRoot: string,
  overrideRoot: string,
): { targets: ComponentTarget[]; unsupported: ComponentTarget[] } {
  const targets: ComponentTarget[] = [];
  const unsupported: ComponentTarget[] = [];

  for (const filePath of findTsxFiles(srcRoot)) {
    const normalizedPath = normalizePath(filePath);

    if (normalizedPath.startsWith(overrideRoot)) {
      continue;
    }

    const source = fs.readFileSync(filePath, "utf8");
    targets.push(...collectComponentTargets(source, normalizedPath));
    unsupported.push(
      ...collectUnsupportedComponentTargets(source, normalizedPath),
    );
  }

  return { targets, unsupported };
}

export function assertUniqueComponentNames(targets: ComponentTarget[]) {
  const componentFiles = new Map<string, Set<string>>();

  for (const target of targets) {
    const files = componentFiles.get(target.name) ?? new Set<string>();
    files.add(target.file);
    componentFiles.set(target.name, files);
  }

  const duplicates = Array.from(componentFiles.entries())
    .filter(([, files]) => files.size > 1)
    .sort(([left], [right]) => left.localeCompare(right));

  if (duplicates.length === 0) {
    return;
  }

  const message = duplicates
    .map(([name, files]) =>
      [
        `- ${name}`,
        ...Array.from(files)
          .sort()
          .map((file) => `  ${file}`),
      ].join("\n"),
    )
    .join("\n");

  throw new Error(
    `Duplicate exported component names are not allowed for auto-registration:\n${message}`,
  );
}

export function assertAllowlistFormsSupported(
  unsupported: ComponentTarget[],
  include: ReadonlySet<string> | null | undefined,
) {
  if (!include) {
    return;
  }

  const hits = unsupported
    .filter((target) => include.has(target.name))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.file.localeCompare(right.file),
    );

  if (hits.length === 0) {
    return;
  }

  const list = hits
    .map((target) => `- ${target.name}\n  ${target.file}`)
    .join("\n");

  throw new Error(
    [
      "Components requested in REACT_MFE_REGISTERED_COMPONENTS use an unsupported export form and cannot be auto-registered:",
      list,
      "Use 'export function', 'export const X = …' (single declarator), or 'export default'.",
    ].join("\n"),
  );
}

export function assertKnownComponentNames(
  targets: ComponentTarget[],
  include: ReadonlySet<string> | null | undefined,
  unsupported: ComponentTarget[],
) {
  if (!include) {
    return;
  }

  const knownNames = new Set(targets.map((target) => target.name));
  const unsupportedNames = new Set(unsupported.map((t) => t.name));
  const unknownNames = Array.from(include)
    .filter((name) => !knownNames.has(name) && !unsupportedNames.has(name))
    .sort((left, right) => left.localeCompare(right));

  if (unknownNames.length === 0) {
    return;
  }

  throw new Error(
    [
      "Unknown component names in REACT_MFE_REGISTERED_COMPONENTS:",
      ...unknownNames.map((name) => `- ${name}`),
    ].join("\n"),
  );
}

export function transformSource(
  source: string,
  id: string,
  include: ReadonlySet<string> | null | undefined,
) {
  if (!source.includes("export")) {
    return null;
  }

  const sourceFile = ts.createSourceFile(
    id,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const edits: Edit[] = [];
  const transformedNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
    const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);

    if (
      isExported &&
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isPascalCase(statement.name.text) &&
      isComponentFunction(statement)
    ) {
      const exportName = statement.name.text;
      if (!shouldRegisterComponent(exportName, include)) {
        continue;
      }

      const registeredName = uniqueName(source, `${exportName}Registered`);

      removeExportAndDefaultModifiers(sourceFile, statement, edits);
      edits.push({
        start: statement.end,
        end: statement.end,
        text: appendRegistration({
          exportName,
          registeredName,
          isDefault,
        }),
      });
      transformedNames.add(exportName);
      continue;
    }

    if (
      isExported &&
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length === 1
    ) {
      const declaration = statement.declarationList.declarations[0];

      if (
        !ts.isIdentifier(declaration.name) ||
        !isPascalCase(declaration.name.text) ||
        !isComponentInitializer(declaration.initializer)
      ) {
        continue;
      }

      const exportName = declaration.name.text;
      if (!shouldRegisterComponent(exportName, include)) {
        continue;
      }

      const registeredName = uniqueName(source, `${exportName}Registered`);

      removeExportAndDefaultModifiers(sourceFile, statement, edits);
      edits.push({
        start: statement.end,
        end: statement.end,
        text: appendRegistration({
          exportName,
          registeredName,
          isDefault: false,
        }),
      });
      transformedNames.add(exportName);
      continue;
    }

    if (
      ts.isExportAssignment(statement) &&
      ts.isIdentifier(statement.expression) &&
      isPascalCase(statement.expression.text) &&
      !transformedNames.has(statement.expression.text)
    ) {
      const exportName = statement.expression.text;
      if (!shouldRegisterComponent(exportName, include)) {
        continue;
      }

      const declaration = findLocalComponentDeclaration(sourceFile, exportName);

      if (!declaration) {
        continue;
      }

      const registeredName = uniqueName(source, `${exportName}Registered`);
      edits.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        text: `const ${registeredName} = ${REGISTER_ALIAS}(${JSON.stringify(
          exportName,
        )}, ${exportName});\nexport default ${registeredName};`,
      });
      transformedNames.add(exportName);
    }
  }

  if (edits.length === 0) {
    return null;
  }

  edits.push(createRegisterImport(sourceFile));
  return applyEdits(source, id, edits);
}

export function autoRegisterComponents({
  include = null,
}: AutoRegisterComponentsOptions = {}): Plugin {
  let srcRoot = "";
  let overrideRoot = "";

  return {
    name: "auto-register-components",
    enforce: "pre",
    configResolved(config) {
      srcRoot = `${normalizePath(path.resolve(config.root, "src"))}/`;
      overrideRoot = `${normalizePath(
        path.resolve(config.root, "src/lib/override"),
      )}/`;
    },
    buildStart() {
      const { targets, unsupported } = collectRegisteredComponentTargets(
        srcRoot,
        overrideRoot,
      );
      assertUniqueComponentNames(targets);
      assertAllowlistFormsSupported(unsupported, include);
      assertKnownComponentNames(targets, include, unsupported);
    },
    transform(source, id) {
      const normalizedId = normalizePath(id.split("?")[0]);

      if (
        !normalizedId.endsWith(".tsx") ||
        !normalizedId.startsWith(srcRoot) ||
        normalizedId.startsWith(overrideRoot)
      ) {
        return null;
      }

      const transformed = transformSource(source, normalizedId, include);
      if (!transformed) {
        return null;
      }

      return {
        code: transformed.code,
        map: transformed.map,
      };
    },
  };
}
