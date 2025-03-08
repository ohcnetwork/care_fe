const fs = require("fs");
const path = require("path");
const glob = require("glob");
const scanner = require("i18next-scanner");

async function extractAndCleanTranslations(options) {
  const { src, localesPath, extensions, locales } = options;
  const translationFileDynamicKeyPattern = /[a-zA-Z_]*__[a-zA-Z._]*/;

  if (!src || !localesPath) {
    throw new Error("src, localesPath are required options.");
  }

  const files = glob.sync(`**/*.+(${extensions.join("|")})`, {
    cwd: src,
    ignore: ["node_modules/**", "style/**", "types/**"],
  });
  const allUsedKeys = new Set();

  const scanOptions = {
    debug: false,
    removeUnusedKeys: false,
    lngs: locales,
    ns: ["care_fe"],
    defaultLng: "en",
    defaultNs: "care_fe",
    func: {
      list: ["i18n.t", "t"],
    },
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      prefix: "{{",
      suffix: "}}",
    },
    allowDynamicKeys: true,
  };

  const parser = new scanner.Parser(scanOptions);
  files.forEach((file) => {
    const filePath = path.join(src, file);
    const content = fs.readFileSync(filePath, "utf-8");

    parser.parseFuncFromString(
      content,
      { list: ["i18n.t", "t"] },
      (key, options) => {
        parser.set(key, options);
        allUsedKeys.add(key);
      },
    );
  });

  // const localeFiles = glob.sync(`en.json`, { cwd: localesPath });
  const localeFiles = [];

  locales.forEach((locale) => {
    const files = glob.sync(`${locale}.json`, { cwd: localesPath });
    if (files.length > 0) {
      localeFiles.push(...files);
    }
  });

  for (const localeFile of localeFiles) {
    const locale = path.basename(localeFile, ".json");
    const localeFilePath = path.join(localesPath, localeFile);
    const translations = JSON.parse(fs.readFileSync(localeFilePath, "utf-8"));

    const keys = Object.keys(translations);
    const cleanedTranslations = {};

    for (const key of keys) {
      if (allUsedKeys.has(key)) {
        cleanedTranslations[key] = translations[key];
      } else if (translationFileDynamicKeyPattern.test(key)) {
        cleanedTranslations[key] = translations[key];
      }
    }

    fs.writeFileSync(
      localeFilePath,
      JSON.stringify(cleanedTranslations, null, 2),
    );
    console.log(`Cleaned translations for ${locale}.`);
  }
}
async function main() {
  const args = process.argv.slice(2);
  let locales = ["en"];
  const localesArgIndex = args.indexOf("--locales");
  if (localesArgIndex !== -1) {
    if (localesArgIndex + 1 < args.length) {
      locales = args.slice(localesArgIndex + 1);
    } else {
      console.warn(
        "Warning: --locales flag provided without any locales. Using default 'en'.",
      );
    }
  }
  try {
    await extractAndCleanTranslations({
      src: "./src",
      localesPath: "./public/locale",
      locales: locales,
      extensions: ["ts", "tsx"],
    });
    console.log("Translation extraction and cleanup completed.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
