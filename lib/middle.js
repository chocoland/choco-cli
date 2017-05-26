#!/usr/bin/env node

module.exports.pipe = cli => {
  cli.command('middle', (argv) => {

  })
    .option('-h', argv => {
      process.exit();
    });
};
