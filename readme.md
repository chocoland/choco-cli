# How to install

```fish
# npm i -g choco-cli
```
## Choco server with config file

```fish
$ cd any/path
$ touch choco.yml
$ nano choco.yml
```
```yaml
server:
  path: "./public-folder"
  port: 3000
  key: "../path/to/server.key"
  cert: "../path/to/server.crt"
```

## Choco server with commands

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

## listen server 

```fish
$ choco server
```
or
```fish
$ choco server -d ./public-folder -c ../path/to/server.crt -d ./ -k ../path/to/server.key
```
