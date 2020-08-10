#!/usr/bin/env node

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const appVersion = uuidv4();

const jsonData = {
  version: appVersion
};

const jsonContent = JSON.stringify(jsonData);

fs.writeFile(
  './public/build-meta.json',
  jsonContent,
  { flag: 'w+', encoding: 'utf8' },
  err => {
    if (err) {
      return console.log(err);
    }
    return null;
  }
);