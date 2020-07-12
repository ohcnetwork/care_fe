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
      console.log('An error occured while writing JSON Object to meta.json');
      return console.log(err);
    }
    console.log('build-meta.json file has been saved with latest version number');
    return null;
  }
);