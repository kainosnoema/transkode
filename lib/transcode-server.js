var cluster = require('cluster')
  , worker = require('./worker');

cluster = cluster()
  .set('workers', 4)
  .use(cluster.reload())
  .use(cluster.debug())
  .start();

if (cluster.isMaster) {
  var master = require('./master');
  master.listen(3456);
} else {
  worker = worker()
    .set('concurrency', 2)
    .start();
}