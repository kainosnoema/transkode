#!/usr/bin/env node

var path = require('path')
  , utils = require('../lib/utils')
  , config = require('../lib/config')
  , Transcoder = require('../');

process.argv[0] = path.basename(process.argv[0]);

var cli = require('cli').enable('version').setApp(__dirname + '/../package.json');

cli.parse({
    port:     ['p', 'Port number for Web UI to listen on', 'number', 4422]
  , config:   ['c', 'Path to config file', 'string']
  , workers:  ['w', 'Number of workers to spawn', 'number']
  , env:      ['e', 'Server environment', 'string', process.env.NODE_ENV || 'development']
}, []);

cli.main(function (args, options) {

  if(options.config) config.load(options.config);

  Transcoder.configure({redis: config.redis});
  
  var clusterName = 'transcoder'
    , cluster = require('cluster');
  cluster = cluster()
    .set('title', clusterName + ' master')
    .set('worker title', clusterName + ' {n}')
    .set('workers', options.workers || 4)
    .use(cluster.debug()) 
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