var cluster = require('cluster')
  , worker = require('./lib/worker');

cluster = cluster()
  .set('workers', 4)
  .use(cluster.reload())
  .use(cluster.debug())
  .start();

if (cluster.isMaster) {
  var port = process.argv[2] || 3456
    , master = require('./lib/master');
  master.listen(port);
} else {
  worker = worker()
    .set('concurrency', 2)
    .start();
}