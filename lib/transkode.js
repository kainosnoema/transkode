/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
  * Module dependencies.
  */

var kue = require('kue')
  , redis = require('redis')
  , Job = require('./job');

var Transkode = module.exports = function Transkode(opts) {
  Transkode.configure(opts);
};

Transkode.prototype.createJob = function(type, data, callback) {
  Job.create(type, data, callback);
}

Transkode.configure = function(opts) {
  opts || (opts = {});

  var redisOpts = opts.redis || {}
    , host = redisOpts.host || '127.0.0.1'
    , port = redisOpts.port || 6379
    , password = opts.password;

  kue.redis.createClient = function() {
    var client = redis.createClient(port, host);
    if(password) client.auth(password);
    return client;
  };
}
