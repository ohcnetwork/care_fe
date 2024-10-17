// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const directory = "src/Locale";

fs.readdir(directory, (err, files) => {
  if (err) throw err;

  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const filePath = path.join(directory, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      const sortedData = Object.keys(data)
        .sort()
        .reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {});

      fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + "\n");
    }
  });
});
