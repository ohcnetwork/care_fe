#!/usr/bin/env node

import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const appVersion = uuidv4();

const jsonData = {
  version: appVersion,
};

const jsonContent = JSON.stringify(jsonData);

fs.writeFile(
  "./public/build-meta.json",
  jsonContent,
  { flag: "w+", encoding: "utf8" },
  (err) => {
    if (err) {
      return console.log(err);
    }
    return null;
  }
);
