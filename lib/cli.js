var argv = process.argv;
var config = require('./config.js');

// drop node path and file path
argv.reverse();
argv.pop();
argv.pop();
argv.reverse();

class Options {
  constructor (callback) {
    this.option = callback;
  }
  run () {
    this.option();
  }
}

class Commands {
  constructor (callback, argv, config) {
    this.options = [];
    this.callback = callback;
    this.argv = argv;
    this.config = config;
  }
  option (opt, callback) {
    this.options[opt] = new Options(callback);
    return this;
  }
  run () {
    this.config
     .then(config => this.callback(this.argv, this.options, config))
     .catch(err => console.error(err));
  }
}

class CLI {
  constructor (opt) {
    if (opt.config)
      this.config = config.load(opt.config);

    else
      this.config = new Promise(resolve => resolve({}));
    this.commands = [];
    this.argv = process.argv;
  }
  command (name, callback) {
    this.commands[name] = new Commands(callback, this.argv, this.config);
    return this.commands[name];
  }
  run () {
    if (this.commands[this.argv[0]]) {
      var exec = this.argv[0];
      this.argv.reverse();
      this.argv.pop();
      this.argv.reverse();
      this.commands[exec].run();
    }
  }
}

module.exports = CLI;
