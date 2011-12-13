/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , express = require('express')
  , kue = require('kue')
  , jobs = kue.createQueue()
  , Job = require('../job')
  , routes = require('./http-routes');

kue.app.set('title', 'Transcode Server');
  
var app = module.exports = express.createServer();

app.use(kue.app);
app.use(express.bodyParser());
app.use(app.router);

app.on('listening', function() {
  // remove any jobs completed by the workers
  jobs.on('job complete', function(id){
    Job.get(id, function(err, job){
      if (err || !job) return;
      job.remove(function(err){
        if (err) throw err;
        utils.log.info('removed completed job #' + job.id);
      });
    });
  });
  
});

// json routes
app.post('/jobs/:type', routes.createJob);
