# Contributing Translation

### For adding a new language

<br>

- Open the Terminal and `cd` to `care_fe/src/Locale`
- Run the command `node update_locale.js <LANG_CODE>`
  Eg: `node update_locale.js ml` for Malayalam
- The command will create a directory with default locale files and you can start translating them.
- After it's done, add the new language to `care_fe/src/Locale/config.ts` file.

### For improving the existing language

<br>

- Open the Terminal and `cd` to `care_fe/src/Locale`
- Run the command `node update_locale.js <LANG_CODE>`
  Eg: `node update_locale.js ml` for Malayalam
- The command will update the new keys which are yet to be translated.
- You can now start translating or improving it.

## Note

⚠ - If you are adding a new word, then please add it to the Default Locale (EN) first and then proceed with your language.

⚠ - After translating, have a look at its appearance. It may be overflowing or cause some UI breaks. Try to adjust the words such that it fits the UI.

⚠ - Try to separate the translation files for each module like `Facility`, `Patient` and more. Don't dump all the keys in one JSON file.
