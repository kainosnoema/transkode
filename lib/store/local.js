var fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , buffer = require('../utils').buffer;

var Local = module.exports = function(fileName, filePath) {
  this.filePath = filePath;
  this.fileName = fileName;
  this.stream = null;
  this.streamBuffer = null;
}

Local.prototype.initReadStream = function(callback) {
  if(this.filePath[0] == '.') {
    callback(new Error('Local path must be absolute'));
  }
  
  this.stream = fs.createReadStream(this.filePath);
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
    callback(null, self.stream);
  });
}

Local.prototype.saveStream = function(stream, callback) {
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

    mkdirp(path.dirname(self.filePath), 0777, function() {
      self.stream.pipe(fs.createWriteStream(self.filePath));
      self.stream.on('end', callback);
      self.resumeStream();
    });
  });

}

Local.prototype.resumeStream = function() {
  this.streamBuffer.resume();
}
