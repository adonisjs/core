# Installation

Installing Adonis is fairly simple and requires `>= node 4.0` with npm `>= 3.0`. Also, it is recommended to make use of [nvm](https://github.com/creationix/nvm) to install and manage multiple versions of NodeJs.

- [Es6 Features](#es6-features)
- [Installing Adonis Cli](#installing-adonis-cli)
- [Cloning Repo](#cloning-repo)

## Es6 Features

Adonis is built on top of `Es6` also known as `ES2015`, making the code more enjoyable and cleaner to read. We do not make use of any transpiler and depends upon core v8 implemented features.

<div class="note">
  <p> 
    <strong>Note</strong>
    Latest version of NodeJs supports following features.
  </p>
</div>

1. Es6 Generators.
2. Es6 Classes.
3. Es6 Variable types ( support for let and const ).
4. Template Strings.
5. Arrow Functions
6. Proxies ( with --harmony_proxies flag )

## Installing Adonis CLI

Cli is a terminal tool to scaffold and generate Adonis project with all required dependencies.

```bash,line-numbers
npm install -g adonis-cli
```

### generate project
```
adonis new yardstick
cd yardstick
npm start
```

## Cloning

You can also clone [adonis-app](https://github.com/adonisjs/adonis-app.git) manually and then install required dependencies using npm

```bash,line-numbers
git clone --dissociate https://github.com/adonisjs/adonis-app yardstick
cd yardstick
npm install --production
```

and then finally you can start the app by running

```bash,line-numbers
npm start
```
