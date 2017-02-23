#!/usr/bin/env node
var spdy = require('spdy');
var fs = require('fs');
var mime = require('mime');
var root = [];
var local = process.cwd();
var argv = process.argv;
var port = 3000;
var address = "0.0.0.0";
var cert;
var key;
var watch = require('watch');
var path = require('path');

// drop node path and file path
argv.reverse();
argv.pop();
argv.pop();
argv.reverse();

var commands = {
  "-h": () => {
    // http-server help
    console.log([
      'usage: choco server [path] [options]',
      '',
      'options:',
      '  -d           dir(public)',
      '  -p           Port to use [3000]',
      '  -a           Address to use [0.0.0.0]',
      '  -U           Use UTC time format in log messages.',
      '',
      '  -s           Enable https and set the path to cert and key.',
      '  -c           Path to ssl cert file.',
      '  -k           Path to ssl key file.',
      '',
      '  -h --help    Print this list and exit.'
    ].join('\n'));
    process.exit();
  },
  "-p": () => {
    // port
    if (typeof argv[2] == "number" && argv[2] >= 0 && argv[2] <= 65535) {
      port = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
    }
    else {
      console.error("invalid port");
      process.exit();
    }
  },
  "-d": () => {
    // dir
    //if (typeof argv[2] == "number" && argv[2] >= 0 && argv[2] <= 65535) {
      local = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
    //}
  },
  "-a": () => {
    // address
  },
  "-s": () => {
    // ssl
  },
  "-c": () => {
    // cert
    if (typeof argv[2] == "string") {
      cert = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
    }
    else {
      console.error("invalid port");
      process.exit();
    }
  },
  "-k": () => {
    // key
    if (typeof argv[2] == "string") {
      key = argv[2];
      argv.splice(1, 1);
      argv.splice(1, 1);
    }
    else {
      console.error("invalid port");
      process.exit();
    }
  }
}

if (argv[0] == "server") {
  while (argv.length > 1) {
    if (commands[argv[1]])
      commands[argv[1]]();
    else
      commands["-h"]();
  }
  // pack the server
  console.log("run");
  serv(root);
}

function serv(root) {
  function readFile(file) {
    return new Promise((success, fail) => {
      fs.readFile(file, function (err, data) {
        if (err) {
          console.log(err);
          fail(err);
        }
        success(data);
      });
      //success(fs.readFileSync(file));
    });
  }
  function assign(i) {
    //console.log(i);
    fs.stat(i, (err, stats) => {
      if (!stats.isDirectory()) {
        var file = readFile(i);
        file.then((success) => {
          var file = "/" + i.replace(local, "");

          // windowa path
          file = file.replace(/\\/g, "/");

          root[file] = success;
        }); 
        file.catch((err) => {
          console.log("err");
        });
      }
    });
  }
    
  watch.watchTree(local, function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
      // Finished walking the tree
      for (i in f) {
        
        assign(i);
      }
    } else if (prev === null) {
      // f is a new file
      for (i in f) {
        assign(f);
      }
    } else if (curr.nlink === 0) {
      // f was removed
      for (i in f) {
        f = f.replace(local, "");
        var index = root.indexOf(f);
        root = root.splice(index, 1);
      }
    } else {
      // f was changed
      for (i in f) {
        assign(f);
      }
    }
    
  })
  var opt = new Promise((success, fail) => {
    var err1, err2, error = "";
    var options = {};
    if (key) {
      try {
        options.key = fs.readFileSync(key);
      } catch (err) {
        err1 = err;
      }
    }

    if (cert) {
      try {
        options.cert = fs.readFileSync(cert);
      } catch (err) {
        err2 = err;
      }
    }

    if (err1) error += err1;
    if (err2) error += err2;
    if (error != "") fail(error);
    success(options);
  });
  
  
  opt.then((options) => {
    console.log(root);
    console.log(process.cwd());
    var server = spdy.createServer(options, function(req, res) {
      var url = req.url;
      console.log(root[url]);
      for (i in root) {
        console.log(i);
      }
      //res.writeHead(200, {"Content-Type": mime.lookup(url != '/' ? url : '/index.html')});
      if (url.substr(-1) == "/") {
        res.writeHead(200, {"Content-Type": mime.lookup(url + "index.html")});
        res.end(root[url + "index.html"]);
        console.log(url + "index.html");
      }
      else if (root[url]) {
        res.writeHead(200, {"Content-Type": mime.lookup(url)});
        res.end(root[url]);
        console.log(url);
      }
      else {
        res.writeHead(400);
        res.write("error 404");
        res.end();
      }
    });

    opt.catch((error) => {
      console.error(error);
    });

    server.listen(port, () => {
      console.log("server is started in " + port);
    });
  });
}