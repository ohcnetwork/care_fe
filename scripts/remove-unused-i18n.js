/**
 * Remove unused i18n keys from locale files
 *
 * This script uses AST-based traversal (via Babel) to extract i18n keys from the codebase
 * and remove unused keys from locale JSON files. It replaces the previous regex-based approach
 * for more reliable and accurate key detection.
 *
 * Features:
 * - ✅ Detects static keys: t("key") and i18n.t("key")
 * - ✅ Detects plural keys: Automatically adds _one and _other variants when count is present
 *   - t("key", { count: ... })
 *   - i18n.t("key", { count: ... })
 *   - <Trans i18nKey="key" values={{ count: ... }} />
 * - ✅ Detects Trans components: <Trans i18nKey="key">...</Trans>
 * - ✅ Detects dynamic keys: t(`prefix__${variable}`) extracts "prefix__" as dynamic prefix
 * - ✅ Handles multiline and nested expressions correctly
 *
 * Usage:
 *   node scripts/remove-unused-i18n.js
 *
 * For testing:
 *   const { extractUsedKeys } = require('./scripts/remove-unused-i18n.js');
 *   const { usedKeys, dynamicPrefixes } = await extractUsedKeys('./src', ['tsx', 'ts']);
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const babel = require("@babel/core");
const traverse = require("@babel/traverse").default;

/**
 * Check if an object expression has a 'count' property
 */
function hasCountProperty(objectExpression) {
  if (!objectExpression || objectExpression.type !== "ObjectExpression") {
    return false;
  }
  return objectExpression.properties.some(
    (prop) =>
      prop.type === "ObjectProperty" &&
      prop.key &&
      ((prop.key.type === "Identifier" && prop.key.name === "count") ||
        (prop.key.type === "StringLiteral" && prop.key.value === "count")),
  );
}

/**
 * Extract static string value from a node
 */
function getStaticValue(node) {
  if (node.type === "StringLiteral") {
    return node.value;
  }
  if (
    node.type === "TemplateLiteral" &&
    node.expressions.length === 0 &&
    node.quasis?.length > 0
  ) {
    return node.quasis[0].value.cooked;
  }
  return null;
}

/**
 * Extract dynamic prefix from template literal (e.g., "status__" from `status__${x}`)
 */
function getDynamicPrefix(node) {
  if (node.type === "TemplateLiteral" && node.expressions.length > 0) {
    // Get the first quasi (the part before the first ${})
    const firstQuasi = node.quasis[0];
    if (firstQuasi && firstQuasi.value.cooked) {
      return firstQuasi.value.cooked;
    }
  }
  return null;
}

/**
 * Check if a CallExpression callee is a t() function call
 */
function isTCall(callee) {
  return callee.type === "Identifier" && callee.name === "t";
}

/**
 * Check if a CallExpression callee is an i18n.t() function call
 */
function isI18nTCall(callee) {
  return (
    callee.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "i18n" &&
    callee.property?.type === "Identifier" &&
    callee.property.name === "t"
  );
}

/**
 * Extract i18n keys used in the codebase via AST traversal
 *
 * @param {string} src - Source directory to scan
 * @param {string[]} extensions - File extensions to process (e.g., ['ts', 'tsx'])
 * @returns {Promise<{usedKeys: Set<string>, dynamicPrefixes: Set<string>}>}
 */
async function extractUsedKeys(src, extensions) {
  const files = glob.sync(`**/*.+(${extensions.join("|")})`, {
    cwd: src,
    ignore: ["node_modules/**", "dist/**"],
  });

  const usedKeys = new Set();
  const dynamicPrefixes = new Set();

  for (const file of files) {
    const filePath = path.join(src, file);
    const content = fs.readFileSync(filePath, "utf-8");

    try {
      // Parse the file to AST
      const ast = babel.parseSync(content, {
        filename: filePath,
        presets: ["@babel/preset-typescript", "@babel/preset-react"],
        sourceType: "module",
      });

      // Traverse the AST to find i18n usage
      traverse(ast, {
        // Handle t("key") and t("key", { count: ... })
        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          // Check if it's t() or i18n.t() call
          const isTFunction = isTCall(callee) || isI18nTCall(callee);

          if (!isTFunction || args.length === 0) {
            return;
          }

          const keyArg = args[0];
          const optionsArg = args[1];

          // Extract static key
          const staticKey = getStaticValue(keyArg);
          if (staticKey) {
            usedKeys.add(staticKey);

            // Check if it has count property for plural
            if (hasCountProperty(optionsArg)) {
              usedKeys.add(`${staticKey}_one`);
              usedKeys.add(`${staticKey}_other`);
            }
          }

          // Extract dynamic prefix
          const dynamicPrefix = getDynamicPrefix(keyArg);
          if (dynamicPrefix) {
            dynamicPrefixes.add(dynamicPrefix);
          }
        },

        // Handle <Trans i18nKey="key" values={{ count: ... }} />
        JSXElement(path) {
          const openingElement = path.node.openingElement;

          // Check if it's a Trans component
          if (
            openingElement.name.type === "JSXIdentifier" &&
            openingElement.name.name === "Trans"
          ) {
            let i18nKey = null;
            let hasCount = false;

            // Find i18nKey and values attributes
            for (const attr of openingElement.attributes) {
              if (
                attr.type !== "JSXAttribute" ||
                attr.name?.type !== "JSXIdentifier"
              )
                continue;

              const attrName = attr.name.name;
              const attrValue = attr.value;

              // Extract i18nKey
              if (attrName === "i18nKey" && attrValue) {
                if (attrValue.type === "StringLiteral") {
                  i18nKey = attrValue.value;
                } else if (
                  attrValue.type === "JSXExpressionContainer" &&
                  attrValue.expression?.type === "StringLiteral"
                ) {
                  i18nKey = attrValue.expression.value;
                }
              }

              // Check if values prop has count
              if (
                attrName === "values" &&
                attrValue?.type === "JSXExpressionContainer" &&
                attrValue.expression
              ) {
                hasCount = hasCountProperty(attrValue.expression);
              }
            }

            // Add the key and plural variants if count is present
            if (i18nKey) {
              usedKeys.add(i18nKey);
              if (hasCount) {
                usedKeys.add(`${i18nKey}_one`);
                usedKeys.add(`${i18nKey}_other`);
              }
            }
          }
        },
      });
    } catch (err) {
      // Log and continue on parse errors so the script can process other files
      console.error(
        "❌ Failed to extract i18n keys from",
        filePath,
        ":",
        err.message,
      );
    }
  }

  return { usedKeys, dynamicPrefixes };
}

function cleanLocaleFiles(localesPath, usedKeys, dynamicPrefixes) {
  const localeFiles = glob.sync("*.json", { cwd: localesPath });

  for (const file of localeFiles) {
    const localeFilePath = path.join(localesPath, file);
    const locale = path.basename(file, ".json");
    const translations = JSON.parse(fs.readFileSync(localeFilePath, "utf-8"));
    const cleaned = {};
    let removedCount = 0;

    for (const key of Object.keys(translations)) {
      if (usedKeys.has(key)) {
        cleaned[key] = translations[key];
        continue;
      }

      // ✅ Keep plural siblings (_one, _other) if base key is used
      const baseKey = key.replace(/_(one|other)$/, "");
      if (usedKeys.has(baseKey)) {
        cleaned[key] = translations[key];
        continue;
      }

      // ✅ Keep keys starting with dynamic prefixes
      if ([...dynamicPrefixes].some((prefix) => key.startsWith(prefix))) {
        cleaned[key] = translations[key];
        continue;
      }

      removedCount++;
    }

    fs.writeFileSync(localeFilePath, JSON.stringify(cleaned, null, 2) + "\n");
    console.log(`✅ Cleaned ${locale} — removed ${removedCount} unused keys`);
  }
}

/**
 * Run cleanup only when called directly via CLI
 */
async function main() {
  const src = "./src";
  const localesPath = "./public/locale";
  const extensions = ["ts", "tsx"];

  console.log("🔍 Scanning codebase for i18n keys...");
  const { usedKeys, dynamicPrefixes } = await extractUsedKeys(src, extensions);

  console.log("🧹 Cleaning locale files...");
  cleanLocaleFiles(localesPath, usedKeys, dynamicPrefixes);

  console.log("🎉 Cleanup complete!");
}

if (require.main === module) {
  main().catch((err) => console.error("❌ Script failed:", err));
}

module.exports = { extractUsedKeys, cleanLocaleFiles };
