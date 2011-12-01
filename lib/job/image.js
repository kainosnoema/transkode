var fs = require('fs')
  , path = require('path')
  , utils = require('../utils')
  , async = require('async')
  , Geometry = require('../geometry')
  , GM = require('gm');

var ImageJob = module.exports = function ImageJob(job) {
  this.data = job.data;
  this.job = job;
  this.gm = null;
};

ImageJob.prototype.process = function process(done) {
  this.inputSource = parseLocation(this.data.input.from);

  var outputs = this.data.outputs
    , total = outputs.length
    , self = this;

  async.series(outputs.map(function(output, i) {
    return function(cb) {
      self.processOutput(output, i, function(err) {
        self.job.progress(i, total);
        cb(err);
      });
    };
  }), done);
}

ImageJob.prototype.processOutput = function processOutput(output, i, callback) {
  this.gm = GM(this.inputSource + '[0]'); // only first frame of gifs

  var outFilePath = parseLocation(output.to)
    , outStream = fs.createWriteStream(outFilePath)
    , self = this;

  utils.log.info('processing job #' + this.job.id + ', output #' + (i + 1));
  this.gm.autoOrient()
  this.applyOperations(output, function() {
    self.gm.stream(output.format || outFilePath, function(err, stdout, stderr, cmd) {
      utils.log.info('`' + cmd + '`');
      if(err) return callback(err);
      stdout.pipe(outStream);
      stderr.pipe(process.stderr);
      stdout.on('close', callback);
    });
  });
}

ImageJob.prototype.applyOperations = function applyOperations(output, callback) {
  var ops = []
    , self = this;
  for(opName in output) {
    if(!(opName in self.operations)) { continue; }
    ops.push((function (opName) {
      return function(cb) {
        self.operations[opName].call(self, output[opName], cb);
      };
    })(opName));
  }
  async.series(ops, callback);
}

ImageJob.prototype.operations = {
  resize: function(opts, callback) {
    var self = this;
    this.gm.size(function(err, size) {
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
}

function parseLocation(location) {
  // just local file paths for now
  var filePath = location.local;
  if(filePath[0] == '.') {
    filePath = path.join(process.cwd(), filePath);
  }
  return filePath;
}
