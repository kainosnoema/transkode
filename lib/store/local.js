/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , buffer = require('../utils').buffer;

var LocalStore = module.exports = function(fileName, filePath) {
  this.fileName = fileName;
  this.filePath = filePath;
  this.stream = null;
  this.streamBuffer = null;
}

LocalStore.prototype.interpolateName = function(meta) {
  var str = this.filePath;
  for(var k in meta) {
    str = str.replace(':' + k, meta[k]);
  }
  this.filePath = str;
}

LocalStore.prototype.initReadStream = function(callback) {
  if(this.filePath[0] == '.') {
    callback(new Error('Local path must be absolute'));
  }

  var self = this;
  fs.stat(this.filePath, function(err){
    if(err) { return callback(err); }
    self.stream = fs.createReadStream(self.filePath);
    callback(null, self.stream);
  });
}

LocalStore.prototype.saveReadStream = function(stream, callback) {
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
    mkdirp(path.dirname(self.filePath), 0777, function(err) {
      if(err) return callback(err);
      self.stream.pipe(fs.createWriteStream(self.filePath));
      self.stream.on('end', callback);
      self.resumeStream();
    });
  });
}

LocalStore.prototype.resumeStream = function() {
  this.streamBuffer.resume();
}

LocalStore.prototype.connect = function(callback) {
  callback(); // noop
}