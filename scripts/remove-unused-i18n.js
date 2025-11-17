const fs = require("fs");
const path = require("path");
const glob = require("glob");
const babel = require("@babel/core");
const { Parser } = require("i18next-scanner");

async function extractUsedKeys(src, extensions) {
  const files = glob.sync(`**/*.+(${extensions.join("|")})`, {
    cwd: src,
    ignore: ["node_modules/**", "dist/**"],
  });

  const parser = new Parser({
    lngs: ["en"],
    ns: ["translation"],
    defaultNs: "translation",
    keySeparator: false,
    nsSeparator: false,
    plural: true,
    func: { list: ["t", "i18n.t"] },
    trans: { component: "Trans", extensions: [".ts", ".tsx"] },
  });

  const usedKeys = new Set();
  const dynamicPrefixes = new Set();

  for (const file of files) {
    const filePath = path.join(src, file);
    const content = fs.readFileSync(filePath, "utf-8");

    try {
      // ✅ Convert TypeScript/JSX → plain JS before scanning
      const { code: jsContent } = babel.transformSync(content, {
        filename: filePath,
        presets: ["@babel/preset-typescript", "@babel/preset-react"],
      });

      // ✅ Extract static i18n keys: t("...")
      parser.parseFuncFromString(
        jsContent,
        { list: ["t", "i18n.t"] },
        (key) => {
          usedKeys.add(key);
        },
      );

      const transRegex = /i18nKey=["'`]([^"'`]+)["'`]/g;
      let match;
      while ((match = transRegex.exec(content)) !== null) {
        usedKeys.add(match[1]); // only the key value
      }

      // ✅ Detect plural usage (adds `_one`, `_other`)
      const pluralRegex =
        /t\(\s*["'`]([a-zA-Z0-9_]+)["'`]\s*,\s*{\s*(?:[^\n]*\n?\s*)?count\s*:/g;
      let match1;
      while ((match1 = pluralRegex.exec(jsContent)) !== null) {
        const baseKey = match1[1];
        usedKeys.add(baseKey);
        usedKeys.add(`${baseKey}_one`);
        usedKeys.add(`${baseKey}_other`);
      }

      // ✅ Detect dynamic keys like t(`status__${x}`)
      const dynamicRegex = /t\(\s*`([^`]+)\$\{[^}]+\}[^`]*`\s*\)/g;
      let dynMatch;
      while ((dynMatch = dynamicRegex.exec(jsContent)) !== null) {
        dynamicPrefixes.add(dynMatch[1]);
      }
    } catch (err) {
      // Log and continue on parse errors so the script can process other files
      console.error("❌ Failed to extract i18n keys from", filePath, ":", err.message);
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
