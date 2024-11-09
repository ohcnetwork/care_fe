// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

const file = "public/locale/en.json";

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const sortedData = Object.keys(data)
  .sort()
  .reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});

fs.writeFileSync(file, JSON.stringify(sortedData, null, 2) + "\n");
