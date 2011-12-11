var utils = require('../utils')
  , async = require('async')
  , Store = require('../store')
  , Geometry = require('../geometry')
  , GM = require('gm');

var ImageJob = module.exports = function ImageJob(job) {
  this.data = job.data;
  this.meta = job.data.meta || {};
  this.job = job;
};

ImageJob.prototype.process = function process(done) {
  utils.log.info('processing job #' + this.job.id);

  this.inStore = Store.parse(this.data.input);
  if(!this.inStore) return done(new Error('Invalid input'));

  var self = this;
  this.inStore.initReadStream(function(err) {
    if(err) return done('Error reading input: ' + err);

    var outputs = self.data.outputs
      , total = outputs.length;

    async.series(outputs.map(function(output, i) {
      return function(cb) {
        self.processOutput(output, i, function(err) {
          self.job.progress(i, total);
          cb(err);
        });
      };
    }), done);
  });
};

ImageJob.prototype.processOutput = function processOutput(output, i, callback) {
  var gm = GM(this.inStore.stream, this.inStore.fileName);

  var outStore = Store.parse(output)
  if(!outStore) return callback(new Error('Invalid output'));
  
  outStore.interpolateName(this.meta);
  
  var format = outStore.format || outStore.fileName
    , self = this;
  gm.autoOrient();
  this.applyProcessors(gm, output, function(err) {
    if(err) return callback(err);
    
    async.parallel({
      connect: function(cb) { outStore.connect(cb); }
    , gm: function(cb) {
        gm.stream(format, function(err, stdout, stderr) {
          if(err) return cb(err);
          // still need to handle stderr from gm
          outStore.captureReadStream(stdout, cb);
        });
      }
    }, function(err, res) {
      if(err) return callback(err);
      outStore.saveStream(function(err) {
        utils.log.info('finished image output #' + self.job.id + '-' + (i + 1));
        callback(err);
      });
    })
  });
  this.inStore.resumeStream();
};

ImageJob.prototype.applyProcessors = function applyProcessors(gm, processors, callback) {
  var ops = []
    , self = this;
  for(opName in processors) {
    if(!(opName in self.processors)) { continue; }
    ops.push((function (opName) {
      return function(cb) {
        self.processors[opName].call(gm, processors[opName], cb);
      };
    })(opName));
  }
  async.series(ops, callback);
};

ImageJob.prototype.processors = {
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
