#!/usr/bin/env node
var spdy = require('spdy');
var fs = require('fs');
var mime = require('mime');
var watch = require('watch');
var local = process.cwd();
var os = require('os');
var ifaces = os.networkInterfaces();
var port;
var address;
var cert;
var key;
var public = [];

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

function serv () {
  function readFile (file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, function (err, data) {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(data);
      });
      // success(fs.readFileSync(file));
    });
  }
  function assign (i) {
    fs.stat(i, (err, stats) => {
      if (err) console.error(err);
      else if (!stats.isDirectory()) {
        var file = readFile(i);
        file.then((success) => {
          var file = /* "/" + */i.replace(local, '');

          // windows path
          file = file.replace(/\\/g, '/');

          public[file] = success;
        });
        file.catch((err) => {
          console.error(err);
        });
      }
    });
  }

  watch.watchTree(local, function (f, curr, prev) {
    if (typeof f === 'object' && prev === null && curr === null)
      // Finished walking the tree
      for (const i in f)
        assign(i);

    else if (prev === null)
      // f is a new file
      // for (const i in f)
      assign(f);

    else if (curr.nlink === 0) {
      // f was removed
      // for (const i in f) {
      f = f.replace(local, '');
      var index = public.indexOf(f);
      public = public.splice(index, 1);
      // }
    }
    else
      // f was changed
      // for (const i in f)
        assign(f);
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
      console.log(error);
      reject(error);
    }
    resolve(options);
  });

  opt.then((options) => {
    var server = spdy.createServer(options, function (req, res) {
      var url = req.url;
      /* for (const i in public) {
        console.log(i)
      } */
      console.log('\x1b[32m' + req.headers.host + '\x1b[0m' + ' \x1b[36m' +
        req.method + '\x1b[0m' + ' \x1b[39m' + url + '\x1b[0m'
        /* +" through HTTP "+ request.httpVersion */);
      // res.writeHead(200, {"Content-Type": mime.lookup(url != '/' ? url : '/index.html')});
      if (url.substr(-1) === '/') {
        res.writeHead(200, {'Content-Type': mime.lookup(url + 'index.html')});
        res.end(public[url + 'index.html']);
      }
      else if (public[url]) {
        res.writeHead(200, {'Content-Type': mime.lookup(url)});
        res.end(public[url]);
      }
      else {
        res.writeHead(400);
        res.write('error 404');
        res.end();
      }
    });

    server.listen(port, address, () => {
      console.log('server is started');
      console.log('  https://127.0.0.1:' + port);
      Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
          if (iface.family !== 'IPv4' || iface.internal !== false)
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;

          if (alias >= 1)
            // this single interface has multiple ipv4 addresses
            // console.log(ifname + ':' + alias, iface.address);
            console.log('  https://' + iface.address + ':' + port);
          else
            // this interface has only one ipv4 adress
            console.log('  https://' + iface.address + ':' + port);

          ++alias;
        });
      });
    });
  });

  opt.catch((error) => {
    console.error(error);
  });
}
