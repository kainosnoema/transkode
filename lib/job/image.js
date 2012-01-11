/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , async = require('async')
  , Store = require('../store')
  , Geometry = require('../geometry')
  , GM = require('gm');

var ImageJob = module.exports = function ImageJob(job) {
  this.data = job.data;
  this.meta = job.data.meta || {};
  this.job = job;
  this.err = null;
};

ImageJob.prototype.process = function process(done) {
  utils.log.info('processing job #' + this.job.id);

  this.inStore = Store.parse(this.data.input);
  if(!this.inStore) return done(new Error('Invalid input'));

  var self = this;
  this.inStore.initReadStream(function(err) {
    if(err) return done(err);

    var outputs = self.data.outputs
      , total = outputs.length;

    self.inStore.stream.setMaxListeners(total * 3);
    self.inStore.stream.on('error', function(err) { self.err = err; });
    async.parallel(outputs.map(function(output, i) {
      return (function(output, i) {
        return function(cb) {
          self._processOutput(output, i, function(err) {
            self.job.progress(i, total);
            cb(err);
          });
        };
      })(output, i);
    }), function(err) { done(self.err || err); });
  });
};

ImageJob.prototype._processOutput = function _processOutput(output, i, callback) {
  var gm = GM(this.inStore.stream, this.inStore.fileName);

  var outStore = Store.parse(output)
  if(!outStore) return callback(new Error('Invalid output'));

  outStore.interpolateName(this.meta);

  var format = outStore.format || outStore.fileName
    , self = this;

  gm.autoOrient();
  applyProcessors(gm, output, function(err) {
    if(self.err || err) return callback(err);

    gm.stream(format, function(err, stdout, stderr) {
      if(self.err || err) return callback(err);

      err = '';
      stderr.on('data', function(data) { err += data; });
      stderr.on('end', function() {
        if(err.length) {
          self.err = err;
          outStore.done = true; // make sure we don't try to save
        }
      });

      outStore.saveReadStream(stdout, function(err) {
        if(self.err || err) return callback(err);
        callback();
        utils.log.info('finished output #' + self.job.id + '-' + (i + 1));
      });
    });
  });
};

var processors = {
  // this == gm
  resize: function(opts, callback) {
    if(opts.to) {
      if(typeof opts.to == 'string') opts.to = opts.to.split('x');
      opts.width = opts.to[0], opts.height = opts.to.slice(-1)[0];
    }
    var self = this;
    this.size({bufferStream: true}, function(err, size) {
      if(err) return callback(err);
      var geo = new Geometry(size).autoOrient(self.data['orientation'])
        , strategy = opts.strategy || 'crop';
      switch(strategy) {
        case 'fit':
          self.out('-resize', opts.width + 'x' + opts.height + '>');
        break;
        case 'crop':
          var transform = geo.cropTo(new Geometry(opts));
          self.in('-size',  transform.resize);
          self.out('-resize', transform.resize);
          self.out('-crop', transform.crop);
          self.out('-page', '+0+0'); // +repage
        break;
        case 'pad':
          // not supported by gm yet
          // this.extent(opts.width, opts.height, '^');
        break;
        case 'stretch':
          self.resize(opts.width, opts.height, '!');
        break;
      }

      if(opts.gravity) {
        self.gravity(opts.gravity);
      }

      // make sure gifs are flattened with common white backgrounds
      if(self.data['format'].match(/gif/i)) {
        self.out('-background', 'white');
        self.out('-flatten')
      }

      callback();
    });
  }
, blur: function(val, callback) {
    this.blur(0, parseInt(val) || 0);
    callback();
  }
, sharpen: function(val, callback) {
    this.sharpen(0, parseInt(val) || 0);
    callback();
  }
, quality: function(val, callback) {
    this.quality(parseInt(val) || 92);
    callback();
  }
};

function applyProcessors(gm, processorOpts, callback) {
  var ops = [];
  for(opName in processorOpts) {
    if(!(opName in processors)) { continue; }
    ops.push((function (opName) {
      return function(cb) {
        processors[opName].call(gm, processorOpts[opName], cb);
      };
    })(opName));
  }
  async.series(ops, callback);
};
