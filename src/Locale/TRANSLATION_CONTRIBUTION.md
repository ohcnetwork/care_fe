# Contributing Translations

## Adding a new language

- Open the Terminal and `cd` to `care_fe/src/Locale`
- Run the command `node update_locale.js <LANG_CODE>`
  Eg: `node update_locale.js ml` for Malayalam
- The command will create a directory with default locale files.
- After it's done, add the new language to `care_fe/src/Locale/config.ts` file.

## Note

⚠ - Try to separate the translation files for each module like `Facility`, `Patient` and more. Don't dump all the keys in one JSON file.
