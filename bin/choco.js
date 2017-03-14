#!/usr/bin/env node

var CLI = require('../lib/cli.js');
var server = require('../lib/server.js');
var middle = require('../lib/middle.js');

CLI = new CLI({
  config: 'choco.yml'
});

server.pipe(CLI);
middle.pipe(CLI);

CLI.run();
