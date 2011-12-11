/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , Job = require('../job')
  , jobs = require('kue').createQueue();

var Worker = module.exports = function Worker(opts) {
  if(!(this instanceof Worker)) {
    return new Worker(opts);
  }
  
  var defaults = {
    concurrency: 1
  };
  
  this.options = utils.extend(defaults, opts);
}

Worker.prototype.set = function(key, val){
  this.options[key] = val;
  return this;
};

Worker.prototype.start = function start() {
  var id = process.env.CLUSTER_WORKER;
  if(id % 2 == 0) {
    jobs.process(Job.key('image'), this.options['concurrency'], Job.processor('image'));
    utils.log.info('processing image jobs');
  } else {
    jobs.process(Job.key('video'), this.options['concurrency'], Job.processor('video'));
    utils.log.info('processing video jobs');
  }
};