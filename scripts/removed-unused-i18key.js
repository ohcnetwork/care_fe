const fs = require("fs");
const path = require("path");
const glob = require("glob");
const scanner = require("i18next-scanner");
const babel = require("@babel/core");

async function extractAndCleanTranslations(options) {
  const { src, localesPath, extensions, locales } = options;

  if (!src || !localesPath) {
    throw new Error("src, localesPath are required options.");
  }
  if (!extensions || !Array.isArray(extensions) || extensions.length === 0) {
    throw new Error("extensions must be a non-empty array.");
  }
  const files = glob.sync(`**/*.+(${extensions.join("|")})`, {
    cwd: src,
    ignore: ["node_modules/**", "style/**", "types/**"],
  });

  if (files.length === 0) {
    throw new Error(
      `No files found in ${src} with extensions ${extensions.join(", ")}.`,
    );
  }

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
    plural: true,
    trans: {
      component: "Trans",
      extensions: [".ts", ".tsx"],
      key: "i18nKey",
    },
  };

  // Create parser and iterate over all files
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

    // To handle Trans component, transform the file into js and scan it for Trans component
    if (
      content.includes("<Trans") &&
      (content.includes("react-i18next") || content.includes("i18next"))
    ) {
      let parsedContent = content;
      try {
        const result = babel.transformSync(content, {
          filename: filePath,
          presets: ["@babel/preset-typescript"],
        });
        parsedContent = result.code;
      } catch (error) {
        console.warn(
          `Warning: Failed to transform ${filePath}, skipping Trans component parsing: ${error.message}`,
        );
      }
      parser.parseTransFromString(parsedContent, (key, options) => {
        parser.set(key, options);
        allUsedKeys.add(key);
      });
    }
  });

  // get all locale files in localesPath
  const localeFiles = [];
  locales.forEach((locale) => {
    if (locale !== "en") {
      console.warn(
        `Warning: Processing non-English locale '${locale}'. ` +
          `Make sure this doesn’t conflict with Crowdin-managed translations.`,
      );
    }
    const files = glob.sync(`${locale}.json`, { cwd: localesPath });
    if (files.length > 0) {
      localeFiles.push(...files);
    } else {
      console.warn(`Warning: No locale file found for ${locale}`);
    }
  });

  // iterate over all locale files and clean the unused keys, if dynamic keys are found, keep them
  for (const localeFile of localeFiles) {
    const locale = path.basename(localeFile, ".json");
    const localeFilePath = path.join(localesPath, localeFile);

    // Create backup if not in dry-run mode
    if (!options.dryRun) {
      const backupPath = `${localeFilePath}.backup.${Date.now()}`;
      try {
        fs.copyFileSync(localeFilePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      } catch (error) {
        console.error(
          `Failed to create backup for ${localeFilePath}: ${error.message}`,
        );
        continue;
      }
    }

    let translations;
    try {
      translations = JSON.parse(fs.readFileSync(localeFilePath, "utf-8"));
    } catch (error) {
      console.error(`Error parsing ${localeFilePath}: ${error.message}`);
      continue;
    }

    const keys = Object.keys(translations);
    const cleanedTranslations = {};
    const dynamicPrefixes = [
      "ENCOUNTER_TAB__",
      "resource_status__",
      "DAYS_OF_WEEK_SHORT__",
      "DAYS_OF_WEEK__",
      "encounter_priority__",
      "encounter_class__",
      "encounter_class_description__",
      "encounter_discharge_disposition__",
      "GENDER__",
      "encounter_status__",
      "encounter_admit_sources__",
      "encounter_diet_preference__",
      "medication_status__",
      "Diagnosis_",
      "SCHEDULE_AVAILABILITY_TYPE_DESCRIPTION__",
      "SCHEDULE_AVAILABILITY_TYPE__",
      "SORT_OPTIONS__",
      "SYSTEM__govt_org_type__",
      "SYSTEM__org_type__",
      "USERMANAGEMENT_TAB__",
      "consent_category__",
      "consent_status__",
      "contact_point_placeholder__",
      "encounter_re_admission__",
      "facility_organization_type__",
      "location_form__",
      "patient__",
    ];
    for (const key of keys) {
      if (
        allUsedKeys.has(key) ||
        dynamicPrefixes.some((prefix) => key.startsWith(prefix))
      ) {
        cleanedTranslations[key] = translations[key];
      }
    }

    if (options.dryRun) {
      console.log(`[DRY RUN] Would update ${localeFilePath}`);
    } else {
      try {
        fs.writeFileSync(
          localeFilePath,
          JSON.stringify(cleanedTranslations, null, 2),
        );
        console.log(`Cleaned translations for ${locale}.`);
      } catch (error) {
        console.error(`Error writing ${localeFilePath}: ${error.message}`);
        continue;
      }
    }
  }
}
async function main() {
  const args = process.argv.slice(2);
  const options = {
    src: "./src",
    localesPath: "./public/locale",
    locales: ["en"],
    extensions: ["ts", "tsx"],
  };
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--locales":
        if (i + 1 < args.length) {
          options.locales = args.slice(i + 1);
          break;
        }
        console.warn(
          "Warning: --locales flag provided without any locales. Using default 'en'.",
        );
        break;
      case "--src":
        if (i + 1 < args.length) options.src = args[++i];
        break;
      case "--locales-path":
        if (i + 1 < args.length) options.localesPath = args[++i];
        break;
    }
  }
  try {
    await extractAndCleanTranslations(options);
    console.log("Translation extraction and cleanup completed.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
