'use strict';
const chalk = require('chalk');
const _ = require('lodash.get');
const Archive = require('archive-tool');
const tool = require('node-tool-utils');
const Boilerplate = require('./init');
const builder = require('./builder');
const utils = require('./utils');

module.exports = class Action {
  constructor(command) {
    this.command = command;
    this.program = command.program;
    this.baseDir = command.baseDir;
  }

  init(boilerplate, options) {
    return new Boilerplate(boilerplate).init(options);
  }

  install(options) {
    const config = utils.initWebpackConfig(this.program, {
      install: {
        check: true,
        npm: options.mode || 'npm'
      }
    });
    builder.getWebpackConfig(config);
  }

  dev(options) {
    const config = utils.initWebpackConfig(this.program, options);
    builder.server(config);
  }

  start(options) {
    const config = utils.initWebpackConfig(this.program, options);
    builder.server(config);
  }

  build(env, options) {
    const config = utils.initWebpackConfig(this.program, { env, cliDevtool : options.devtool}, { speed: options.speed });
    // 编译完成, 启动 HTTP Server 访问静态页面
    if (options.server) {
      const done = config.config.done;
      config.config.done = (multiCompiler, compilation) => {
        done && done(multiCompiler, compilation);
        const compiler = multiCompiler.compilers.find(item => {
          return item.options.target === 'web';
        });
        if (compiler) { // 自动解析 output.path
          const dist = compiler.options.output.path;
          const port = options.server === true ? undefined : options.server;
          tool.httpServer({
            dist,
            port
          });
        }
      };
    }
    builder.build(config);
  }

  dll(env, options) {
    const config = utils.initWebpackConfig(program, { env, framework: 'dll' }, { dll: true });
    builder.build(config);
  }

  print(env, options) {
    const config = utils.initWebpackConfig(this.program, { env });
    const webpackConfig = builder.getWebpackConfig(config);
    const webpackConfigList = Array.isArray(webpackConfig) ? webpackConfig : (webpackConfig ? [webpackConfig] : []);
    if (webpackConfigList.length) {
      const key = options.key || options.node;
      if (key) {
        webpackConfigList.forEach(item => {
          console.log(chalk.green(`easywebpack-cli: webpack ${this.program.type || item.target || ''} ${key} info:\r\n`), _(item, key));
        });
      } else {
        console.log(chalk.green('easywebpack-cli: webpack config info:\r\n'), webpackConfig);
      }
    } else {
      console.warn(chalk.yellow('easywebpack-cli: webpack config is empty'));
    }
  }

  server(options) {
    tool.httpServer(options);
  }

  zip(options) {
    const config = utils.initArchiveOption(this.baseDir, this.program, options);
    const archive = new Archive(config);
    archive.zip();
  }

  tar(options) {
    const config = utils.initArchiveOption(this.baseDir, this.program, options);
    const archive = new Archive(config);
    archive.tar();
  }

  deploy(options) {
    console.log('doing.....');
  }

  upgrade(options) {
    require('./upgrade')(this.baseDir, options);
  }

  clean(dir) {
    if (dir === 'all') {
      utils.clearTempDir(this.baseDir);
      utils.clearManifest(this.baseDir);
      utils.clearBuildDir(this.baseDir);
    } else if (dir) {
      tool.rm(dir);
    } else {
      utils.clearTempDir(this.baseDir);
    }
  }

  kill(port) {
    tool.kill(port || '7001,9000,9001');
  }

  open(dir) {
    const filepath = dir ? dir : utils.getCompileTempDir(this.baseDir);
    tool.open(filepath);
    process.exit();
  }

  debug() {
    // console.log(chalk.yellow('[debug] command not implemented'));
  }

  test() {
    // console.log(chalk.yellow('[test] command not implemented'));
  }

  cov() {
    // console.log(chalk.yellow('[cov] command not implemented'));
  }

  add() {
    // console.log(chalk.yellow('[add] command not implemented'));
  }
};