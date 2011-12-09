#!/usr/bin/env node

var path   = require('path');

process.argv[0] = path.basename(process.argv[0]);
var cli = require('cli').enable('version').setApp(__dirname + '/../package.json');

cli.parse({
    port:     ['p', 'Port number to listen on', 'number', 4422]
  , config:   ['c', 'Path to config file', 'string']
  , workers:  ['w', 'Number of workers to spawn', 'number']
  , env:      ['e', 'Server environment', 'string', process.env.NODE_ENV || 'development']
}, []);

cli.main(function (args, options) {
  var cluster = require('cluster')
    , utils   = require('../lib/utils')
    , config  = require('../lib/config')
    , worker  = require('../lib/worker');

  if(options.config) {
    process.env.TRANSCODER_CONFIG_PATH = normalizeFilePath(options.config);
  }

  cluster = cluster()
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
    worker = worker()
      .set('concurrency', 2)
      .start();
  }
});

function normalizeFilePath(filePath) {
  if(filePath[0] != '/') filePath = path.join(process.cwd(), filePath);
  return filePath;
}