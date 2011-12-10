var kue = require('kue')
  , redis = require('redis')
  , Job = require('./job');

var Transcoder = module.exports = function Transcoder(opts) {
  Transcoder.configure(opts);
};

Transcoder.prototype.createJob = function(type, data, callback) {
  Job.create.call(Job, type, data, callback);
}

Transcoder.configure = function(opts) {
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
