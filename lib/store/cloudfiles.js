var cloudfiles = require('cloudfiles')
  , config = require('../config')
  , buffer = require('../utils').buffer
  , cfConfig; // lazy load config

var CloudFiles = module.exports = function(fileName, opts) {
  // lazy load config
  if(!cfConfig) cfConfig = config.cloudfiles || {};
  
  opts || (opts = {});
  
  this.auth = opts.auth || {};
  this.fileName = fileName;
  this.containerName = opts.container || cfConfig.container;
  this.name = opts.name;
  this.stream = null;
  this.streamBuffer = null;
}

CloudFiles.prototype.interpolate = function(meta) {
  var str = this.name;
  for(var k in meta) {
    str = str.replace(':' + k, meta[k]);
  }
  this.name = str;
}

CloudFiles.prototype.initReadStream = function(callback) {
  callback(new Error('cloudfiles input not supported yet'))
}

CloudFiles.prototype.saveStream = function(stream, callback) {
  if(!this.containerName) return callback(new Error('cloudfiles container not specified'));
  if(!this.name) return callback(new Error('cloudfiles object name not specified'));

  this.stream = stream;
  this.streamBuffer = buffer(this.stream);
  this.done = false;
  
  var self = this;
  this.stream.on('error', function(err) {
    if(self.done) return;
    self.done = true;

    callback(err);
  });
  
  this.stream.on('end', function() {
    if(self.done) return;
    self.done = true;
    
    self.openContainer(self.containerName, function(err, cf) {
      if(err) return callback(err);
      var opts = {
        remote: self.name
      , stream: self.stream
      , headers: { 'content-length': self.streamBuffer.length() }
      };
      cf.addFile(self.containerName, opts, callback);
      self.resumeStream();
    });
  });
}

CloudFiles.prototype.resumeStream = function() {
  this.streamBuffer.resume();
}

CloudFiles.prototype.openContainer = function(name, callback) {
  this.connect(function(err, cf) {
    if(err) return callback(err);
    cf.createContainer(name, function(err, container) {
      if(err) return callback(err);
      callback(null, cf);
    });
  })
}

CloudFiles.prototype.connect = function(callback) {
  if(!this.auth.username && !cfConfig.username) {
    return callback(new Error('cloudfiles not configured properly'));
  }
  
  var cf = cloudfiles.createClient({
        auth: {
          username: this.auth.username || cfConfig.username
        , apiKey: this.auth.api_key || cfConfig.api_key
        , host: this.auth.host || cfConfig.host
        }
      , servicenet: !!cfConfig.username && config.env == 'production'
      });
  cf.setAuth(function(err, res) {
    if(err) return callback(err);
    callback(null, cf);
  });
}