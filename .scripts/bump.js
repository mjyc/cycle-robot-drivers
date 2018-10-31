#!/usr/bin/env node

// copied from https://github.com/cyclejs/cyclejs/blob/b98b3a297d42309c2c155a236326096a767a21b1/.scripts/bump.js

const path = require('path');
const fs = require('fs');

const packagePath = process.argv[2];
const bumpType = process.argv[3];

if (!packagePath || packagePath === '') {
  console.log("Please provide a relative package.json path as the first argument");
  process.exit(1);
}

const packageJSON = require(path.join(process.cwd(), packagePath));

const version = packageJSON.version;

let [major, minor, patch, ...others] = version.split('.').map(s => parseInt(s, 10));

if (bumpType == '--major') {
  major += 1;
} else if (bumpType == '--minor') {
  minor += 1;
} else if (bumpType == '--patch') {
  patch += 1;
} else {
  console.log("Please specify --major, --minor or --patch as the second argument");
  process.exit(1);
}

packageJSON.version = [major, minor, patch, ...others].join('.');

fs.writeFileSync(packagePath, JSON.stringify(packageJSON, null, 2) + "\n");
