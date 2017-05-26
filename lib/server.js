#!/usr/bin/env node
var spdy = require('spdy');
var fs = require('fs');
var mime = require('mime');
var chokidar = require('chokidar');
var local = process.cwd();
var os = require('os');
var ifaces = os.networkInterfaces();
var path = require('path');
var port;
var address;
var cert;
var key;

module.exports.pipe = cli => {
  cli.command('server', (argv, opt, config) => {
    port = config.server.port || 3000;
    address = config.server.address || '0.0.0.0';
    cert = config.server.cert || undefined;
    key = config.server.key || undefined;

    while (argv.length > 0)
      if (opt[argv[0]])
        opt[argv[0]].run();
      else
        opt['-h'].run();

    // pack the server
    serv();
  })
    .option('-h', argv => {
      // http-server help
      console.log([
        'usage: choco server [path] [options]',
        '',
        'options:',
        '  -d           dir(public)',
        '  -p           Port to use [3000]',
        '  -a           Address to use [0.0.0.0]',
        '',
        // '  -s           Enable https and set the path to cert and key.',
        '  -c           Path to ssl cert file.',
        '  -k           Path to ssl key file.',
        '',
        '  -h --help    Print this list and exit.'
      ].join('\n'));
      process.exit();
    })
    .option('-p', argv => {
      // port
      if (typeof argv[2] === 'number' && argv[2] >= 0 && argv[2] <= 65535) {
        port = argv[2];
        argv.splice(1, 1);
        argv.splice(1, 1);
      }
      else {
        console.error('invalid port');
        process.exit();
      }
    })
    .option('-d', argv => {
      // dir
      // if (typeof argv[2] === "number" && argv[2] >= 0 && argv[2] <= 65535) {
      local = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
      // }
    })
    .option('-a', argv => {
      // dir
      // if (typeof argv[2] === "number" && argv[2] >= 0 && argv[2] <= 65535) {
      address = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
      // }
    })
    /* .option('-s', argv => {

    })*/
    .option('-c', argv => {
      // cert
      if (typeof argv[2] === 'string') {
        cert = argv[2];
        argv.splice(1, 1);
        argv.splice(1, 1);
      }
      else {
        console.error('invalid port');
        process.exit();
      }
    })
    .option('-k', argv => {
      // key
      if (typeof argv[2] === 'string') {
        key = argv[2];
        argv.splice(1, 1);
        argv.splice(1, 1);
      }
      else {
        console.error('invalid port');
        process.exit();
      }
    });
};

var cache = [];

function serv () {
  function get_file (i) {
    cache = cache || [];
    if (cache[i])
      return cache[i];
    var file = new Promise((resolve, reject) => {
      fs.readFile(i, (err, data) => {
        if (err)
          reject(err);
        resolve(data);
      });
          // success(fs.readFileSync(file));
    });
    cache[i] = file;
    return file;
  }

  var watch = chokidar.watch('.', {
    ignored: /(node_modules|\.swp$|\.swo$|npm-debug\.log$|\.git)/
    // cwd: '.'
  })
  .on('unlink', source => {
    let now = path.join(local, source);
    cache = cache.filter((value, index) => index !== now);
  })
  .on('change', source => {
    let now = path.join(local, source);
    cache = cache.filter((value, index) => index !== now);
  });

  var opt = new Promise((resolve, reject) => {
    var err1;
    var err2;
    var error = '';
    var options = {};
    if (key)
      try {
        options.key = fs.readFileSync(key);
      }
      catch (err) {
        err1 = err;
      }

    if (cert)
      try {
        options.cert = fs.readFileSync(cert);
      }
      catch (err) {
        err2 = err;
      }

    if (err1) error += err1;
    if (err2) error += err2;
    if (error !== '') {
      console.error(error);
      reject(error);
    }
    resolve(options);
  });

  opt.then((options) => {
    var server = spdy.createServer(options, function (req, res) {
      var url = req.url;
      var public = watch.getWatched();
      if (/\/$/.test(url))
        url = url + 'index.html';
      console.log(` \x1b[32m ${req.headers.host}\x1b[0m\x1b[36m ${req.method} \x1b[0m\x1b[39m${url}\x1b[0m`);

      url = url.split(/\//)
        .reverse();
        // .filter(element => element !== '');
      var [file, ... folder] = url;
      folder = folder.reverse();
      if (folder.length !== 1)
        folder = folder.join('/');
      else
        folder = '/';

      if (/\/$/.test(folder))
        folder = folder.replace(/\/$/, '');

      folder = path.join(local, folder);
      // res.writeHead(200, {"Content-Type": mime.lookup(url != '/' ? url : '/index.html')});
      if (public[folder] instanceof Array && public[folder].indexOf(file) !== -1) {
        file = path.join(folder, file);
        res.writeHead(200, {'Content-Type': mime.lookup(file)});
        get_file(file)
          .then(value => res.end(value))
          .catch(err => console.err(err));
      }
      else {
        res.writeHead(400);
        res.write('error 404');
        res.end();
      }
    });

    server.listen(port, address, () => {
      console.log('  server is started');
      console.log('    https://127.0.0.1:' + port);
      Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
          if (iface.family !== 'IPv4' || iface.internal !== false)
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;

          if (alias >= 1)
            // this single interface has multiple ipv4 addresses
            // console.log(ifname + ':' + alias, iface.address);
            console.log('    https://' + iface.address + ':' + port);
          else
            // this interface has only one ipv4 adress
            console.log('    https://' + iface.address + ':' + port);

          ++alias;
        });
      });
    });
  });

  opt.catch((error) => {
    console.error(error);
  });
}
