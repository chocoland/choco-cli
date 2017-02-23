## How to install

```fish
npm i -g choco-cli
```

# Choco server commands

```fish
usage: choco server [path] [options]'

options:'
  -d           dir(./)'
  -p           Port to use [3000]'
  -a           Address to use [0.0.0.0]'
  -U           Use UTC time format in log messages.'

  -s           Enable https and set the path to cert and key.'
  -c           Path to ssl cert file.'
  -k           Path to ssl key file.'

  -h --help    Print this list and exit.'
```

## lister server

```fish
choco server -d ./public-folder -c ../path/to/server.crt -d ./ -k ../path/to/server.key
```