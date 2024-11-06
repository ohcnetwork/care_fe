/* eslint-disable no-undef */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "fs";

const DEFAULT_LOCALE = "en";

const lng = process.argv[2]?.toLowerCase();

if (!lng) {
  console.log("No Language Entered!");
  process.exit(1);
}
if (lng === DEFAULT_LOCALE) {
  console.log("It's Default Locale!");
  process.exit(1);
}

const defaultEntryFile = readFile(`./${DEFAULT_LOCALE}/index.ts`);
const defaultAllJsonFiles = getAllJSONFiles(DEFAULT_LOCALE);

if (existsSync(lng)) {
  const allJsonFiles = getAllJSONFiles(lng);
  compareBothFiles(defaultAllJsonFiles, allJsonFiles);
} else {
  mkdirSync(`./${lng}`);

  for (const file in defaultAllJsonFiles) {
    const defaultJSON = defaultAllJsonFiles[file];
    writeFile(`./${lng}/${file}`, JSON.stringify(defaultJSON, null, 2));
    console.log(`Create: ${file}`);
  }

  writeFile(`./${lng}/index.ts`, defaultEntryFile);
  console.log("Create: index.ts");
}

function compareBothFiles(defaultFile, newFile) {
  for (const file in defaultFile) {
    const newObj = {};
    const defaultJSON = defaultFile[file];
    const existingJSON = newFile[file];
    if (existingJSON) {
      for (const key in defaultJSON)
        newObj[key] = existingJSON[key] || defaultJSON[key];
      writeFile(`./${lng}/${file}`, JSON.stringify(newObj, null, 2));
    } else writeFile(`./${lng}/${file}`, JSON.stringify(defaultJSON, null, 2));
    console.log(`Modified: ${file}`);
  }
  writeFile(`./${lng}/index.js`, defaultEntryFile);
  console.log("Modified: index.js");
}

function getAllJSONFiles(folderName) {
  const dir = readdirSync(folderName).filter((e) => e.includes(".json"));
  const files = {};
  dir.forEach((file) => {
    try {
      files[file] = JSON.parse(readFile(`./${folderName}/${file}`));
    } catch (e) {
      throw new Error(`Cannot parse ${file} file!`);
    }
  });
  return files;
}

function writeFile(name, data) {
  return writeFileSync(name, data);
}
function readFile(name) {
  return readFileSync(name, { encoding: "utf-8" });
}
