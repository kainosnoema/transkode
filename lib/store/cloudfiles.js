/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var CF = require('cloudfiles')
  , cfCommon = require('cloudfiles/lib/cloudfiles/common')
  , config = require('../config')
  , buffer = require('../utils').buffer
  , cfConfig; // lazy load config

var CloudFilesStore = module.exports = function(fileName, opts) {
  if(!cfConfig) cfConfig = config.cloudfiles || {}; // lazy load config

  opts || (opts = {});

  this.auth = opts.auth || {};
  this.auth.username || (this.auth.username = cfConfig.username);
  this.auth.api_key || (this.auth.api_key = cfConfig.api_key);
  this.auth.host || (this.auth.host = cfConfig.host);

  this.fileName = fileName;
  this.containerName = opts.container || cfConfig.container;
  this.name = opts.name;
  this.replace = opts.replace;
  this.stream = null;
  this.streamBuffer = null;
  this.connection = null;

  return CloudFilesStore.cache(this);
}

CloudFilesStore.prototype.interpolateName = function(meta) {
  var self = this;
  ['name', 'replace'].forEach(function(attr) {
    var str = self[attr];
    if(!str) return;
    for(var k in meta) {
      str = str.replace(':' + k, meta[k]);
    }
    self[attr] = str;
  });
}

CloudFilesStore.prototype.initReadStream = function(callback) {
  if(!this.containerName) return callback(new Error('cloudfiles container not specified'));
  if(!this.name) return callback(new Error('cloudfiles object name not specified'));

  var self = this;
  this.connect(function(err) {
    if(err) return callback(err);

    self.stream = self.connection.createReadStream(self.containerName, self.name);
    callback(null, self.stream);
  });
}

CloudFilesStore.prototype.saveReadStream = function(stream, callback) {
  if(!this.containerName) return callback(new Error('cloudfiles container not specified'));
  if(!this.name) return callback(new Error('cloudfiles object name not specified'));

  this.stream = stream;
  this.streamBuffer = buffer(stream);
  this.done = false;

  var self = this
    , contentLength = 0;

  this.stream.on('data', function(data) {
    if(self.done) return;
    contentLength += data.length;
  });

  this.stream.on('error', function(err) {
    if(self.done) return;
    self.done = true;
    callback(err);
  });

  this.stream.on('end', function() {
    if(self.done) return;
    self.done = true;

    (function _tryUpload(times) {
      self.connect(function(err) {
        if(err) return callback(err);

        var opts = {
          remote: self.name
        , stream: self.stream
        , headers: { 'content-length': contentLength }
        };

        self.connection.addFile(self.containerName, opts, function(err) {
          if(err) {
            if(err.message.match(/401/) && times < 1) {
              self.connection = null;
              return _tryUpload(++times);
            } else {
              return callback(err);
            }
          }

          if(self.replace) {
            self.connection.destroyFile(self.containerName, self.replace, function() {});
          }
          callback();
        });
        self.resumeStream();
      });
    })(0);
  });
}

CloudFilesStore.prototype.resumeStream = function() {
  this.streamBuffer.resume();
}

CloudFilesStore.prototype.connect = function(callback) {
  if(!this.auth.username && !cfConfig.username) {
    return callback(new Error('cloudfiles not configured properly'));
  }

  if(this.connection) return callback(); // already connected

  var cf = CF.createClient({
        auth: {
          username: this.auth.username
        , apiKey: this.auth.api_key
        , host: this.auth.host
        }
      , servicenet: !!cfConfig.username && config.env == 'production'
      });

  var self = this;
  cf.setAuth(function(err, res, config) {
    if(err) {
      return callback(err);
    } else if(res.statusCode != 204) {
      return callback(new Error('Cloudfiles Error: ' + res.statusCode));
    }

    cf.createContainer(self.containerName, function(err) {
      if(err) return callback(err);
      self.connection = cf;
      callback();
    });
  });
}

CloudFilesStore.connectionsCache = [];
CloudFilesStore.cache = function(store) {
  var key = JSON.stringify(store.auth) + "-" + store.containerName
    , cached = this.connectionsCache[key];
  if(cached) {
    store.connection = cached.connection;
  } else {
    this.connectionsCache[key] = store;
  }
  return store;
}

/*
 * Extend CloudFiles module to support file streaming
 */

CF.Cloudfiles.prototype.createReadStream = function(container, filename) {
  var options = {
    method: 'GET',
    client: self,
    uri: self.storageUrl(container, filename),
  };
  return cfCommon.rackspace(options, function(body, res) {});
};
