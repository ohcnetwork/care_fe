"use strict";

/**
 * Type check for the raviger codemod.
 *
 * A TanStack `params` value must be a `string`. The old template literal
 * accepted any value, such as `string | undefined`. This module asks the
 * TypeScript checker for the type of each `${expr}` and tells the codemod
 * which expressions are safe.
 *
 * The program is built once for each worker process. It uses the project
 * `tsconfig.json`, so it reads the same files as `npx tsc`.
 */

const path = require("node:path");

let createChecker = createProjectChecker;
let cached;

function isStringLike(ts, checker, type) {
  const flags = type.flags;
  if (flags & ts.TypeFlags.Any) return true;
  if (flags & ts.TypeFlags.StringLike) return true;
  if (type.isUnion()) {
    return type.types.every((member) => isStringLike(ts, checker, member));
  }
  if (type.isIntersection()) {
    return type.types.some((member) => isStringLike(ts, checker, member));
  }
  if (flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);
    return !!constraint && isStringLike(ts, checker, constraint);
  }
  return false;
}

function findExpression(ts, sourceFile, start, end) {
  let found;
  (function visit(node) {
    if (found) return;
    if (node.getStart(sourceFile) === start && node.getEnd() === end) {
      found = node;
      return;
    }
    if (node.pos <= start && end <= node.end) ts.forEachChild(node, visit);
  })(sourceFile);
  return found;
}

function wrap(ts, program) {
  const checker = program.getTypeChecker();
  return {
    /** Returns `{ ok, text }`. `ok` is false when the type is not a string. */
    isString(filePath, start, end) {
      const sourceFile = program.getSourceFile(path.resolve(filePath));
      if (!sourceFile) return { ok: false, text: "file is not in the program" };
      const node = findExpression(ts, sourceFile, start, end);
      if (!node) return { ok: false, text: "expression not found" };
      const type = checker.getTypeAtLocation(node);
      return {
        ok: isStringLike(ts, checker, type),
        text: checker.typeToString(type),
      };
    },
  };
}

function createProjectChecker(options) {
  const ts = require("typescript");
  const tsconfig = path.resolve(
    process.cwd(),
    options.tsconfig || "tsconfig.json",
  );
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  return wrap(ts, program);
}

/** Returns the checker, or null when the type check is off. */
function getTypeChecker(options) {
  if (options.typecheck === "false" || options.typecheck === false) return null;
  if (!cached) cached = createChecker(options);
  return cached;
}

/** Lets a test replace the project checker. */
function useCheckerFactory(factory) {
  createChecker = factory || createProjectChecker;
  cached = undefined;
}

module.exports = { getTypeChecker, useCheckerFactory, wrap };
