var utils = require('../utils')
  , async = require('async')
  , Store = require('../store')
  , Geometry = require('../geometry')
  , GM = require('gm');

var ImageJob = module.exports = function ImageJob(job) {
  this.data = job.data;
  this.job = job;
  this.gm = null;
};

ImageJob.prototype.process = function process(done) {
  this.inputStore = Store.parse(this.data.input);
  if(!this.inputStore) return done(new Error('Invalid input'));

  var self = this;
  this.inputStore.initReadStream(function(err) {
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
  utils.log.info('processing job #' + this.job.id + ', output #' + (i + 1));
  
  this.gm = GM(this.inputStore.stream, this.inputStore.fileName);

  var outStore = Store.parse(output)
  if(!outStore) return callback(new Error('Invalid output'));
  
  var self = this;
  this.gm.autoOrient();
  this.applyProcessors(output.processors, function() {
    var format = outStore.format || outStore.fileName;
    self.gm.stream(format, function(err, stdout, stderr, cmd) {
      utils.log.info('`' + cmd + '`');
      if(err) return callback(err);
      // need to handle stderr issues
      outStore.saveStream(stdout, callback);
    });
  });
  this.inputStore.resumeStream();
};

ImageJob.prototype.applyProcessors = function applyProcessors(processors, callback) {
  var ops = []
    , self = this;
  for(opName in processors) {
    if(!(opName in self.processors)) { continue; }
    ops.push((function (opName) {
      return function(cb) {
        self.processors[opName].call(self, processors[opName], cb);
      };
    })(opName));
  }
  async.series(ops, callback);
};

ImageJob.prototype.processors = {
  resize: function(opts, callback) {
    if(opts.to) {
      if(typeof opts.to == 'string') opts.to = opts.to.split('x');
      opts.width = opts.to[0], opts.height = opts.to.slice(-1)[0];
    }
    var self = this;
    this.gm.size({bufferStream: true}, function(err, size) {
      if(err) return callback(err);
      var geo = new Geometry(size).autoOrient(self.gm.data['orientation'])
        , strategy = opts.strategy || 'crop';
      switch(strategy) {
        case 'fit':
          self.gm.out('-resize', opts.width + 'x' + opts.height + '>');
        break;
        case 'crop':
          var transform = geo.cropTo(new Geometry(opts));
          self.gm.in('-size',  transform.resize);
          self.gm.out('-resize', transform.resize);
          self.gm.out('-crop', transform.crop);
          self.gm.out('-page', '+0+0'); // +repage
        break;
        case 'pad':
          // not supported by gm yet
          // this.extent(opts.width, opts.height, '^');
        break;
        case 'stretch':
          self.gm.resize(opts.width, opts.height, '!');
        break;
      }

      if(opts.gravity) {
        self.gm.gravity(opts.gravity);
      }

      // make sure gifs are flattened with common white backgrounds
      if(self.gm.data['format'].match(/gif/i)) {
        self.gm.out('-background', 'white');
        self.gm.out('-flatten')
      }

      callback();
    });
  }
, blur: function(val, callback) {
    this.gm.blur(0, parseInt(val) || 0);
    callback();
  }
, sharpen: function(val, callback) {
    this.gm.sharpen(0, parseInt(val) || 0);
    callback();
  }
, quality: function(val, callback) {
    this.gm.quality(parseInt(val) || 92);
    callback();
  }
};
