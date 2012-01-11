#!/usr/bin/env node

/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var path = require('path');

process.argv[0] = path.basename(process.argv[0]);

var cli = require('cli').enable('version').setApp(__dirname + '/../package.json');

cli.parse({
    port:     ['p', 'Port number for Web UI to listen on', 'number', 4422]
  , config:   ['c', 'Path to config file', 'string']
  , workers:  ['w', 'Number of workers to spawn', 'number']
  , env:      ['e', 'Server environment', 'string', process.env.NODE_ENV || 'development']
}, []);

cli.main(function (args, options) {
  process.env.NODE_ENV = options.env; // set env first

  var utils = require('../lib/utils')
    , config = require('../lib/config')
    , Transkode = require('../');

  if(options.config) config.load(options.config);
  Transkode.configure(config);

  var clusterName = 'transkode'
    , cluster = require('cluster');
  cluster = cluster()
    .in('development')
      .use(cluster.debug())
    .in('all')
      .set('title', clusterName + ' master')
      .set('worker title', clusterName + ' {n}')
      .set('workers', options.workers || 4)
      .start();

  if (cluster.isMaster) {
    var port = options.port
      , master = require('../lib/master');

    master.on('listening', function() {
      utils.log.info("Web UI listening at 127.0.0.1:" + port);
    });
    master.listen(port);
  } else {
    require('../lib/worker')()
      .set('concurrency', 2)
      .start();
  }
});