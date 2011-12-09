var config = require('../config')
  , cloudfiles = require('cloudfiles')
  , buffer = require('../utils').buffer;

var CloudFiles = module.exports = function(fileName, opts) {
  opts || (opts = {});
  
  this.auth = opts.auth || {};
  this.containerName = opts.container;
  this.name = opts.name || fileName;
  this.fileName = fileName;
  this.stream = null;
  this.streamBuffer = null;
}

CloudFiles.prototype.initReadStream = function(callback) {
  callback(new Error('cloudfiles input not supported yet'))
}

CloudFiles.prototype.saveStream = function(stream, callback) {
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
    cf.createContainer(name, function(err, container) {
      if(err) return callback(err);
      callback(null, cf);
    });
  })
}

CloudFiles.prototype.connect = function(callback) {
  var cfConfig = config.cloudfiles;
  if(!this.auth.username && !cfConfig) {
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