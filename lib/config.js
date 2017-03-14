#!/usr/bin/env node
var fs = require('fs');
var yaml = require('js-yaml');
var path = require('path');
module.exports.load = name => {
  return new Promise((resolve, reject) => {
    try {
      var config = path.resolve(process.cwd(), './' + name);
      var obj = yaml.safeLoad(fs.readFileSync(config));
      resolve(obj);
    }
    catch (err) {
      console.error(err);
      reject(err);
    }
  });
};
