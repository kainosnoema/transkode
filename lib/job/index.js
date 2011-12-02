var utils = require('../utils')
  , kue = require('kue')
  , jobs; // lazy instantiation so we can setup first

var Job = module.exports = kue.Job;

// objects having Job#process method

Job.image =
Job.Image = require('./image');

Job.video =
Job.Video = require('./video');

// create new jobs

Job.create = function create(type, data, callback) {
  if(!jobs) jobs = kue.createQueue();
  
  type || (type = '');
  type = type.toLowerCase();

  // validate type
  var jobClass = Job[type];
  if(!jobClass) {
    return callback(["Unsupported job type"]);
  }

  // validate input
  var errs = [];

  if(!data.input) {
    errs.push(new Error("No input specified"));
  }

  if(!data.outputs) {
    errs.push(new Error("No outputs specified"));
  }

  if(errs.length) return callback(errs.pop());

  // save job
  var job = jobs.create(Job.key(type), data)

  job.save(function(err) {
    utils.log.info('created job #' + job.id);
    if(data.wait) {
      job.on('complete', respond);
      job.on('failed', respond);
      function respond(err) {
        Job.get(job.id, function(err, job) {
          callback(null, job);
        });
      }
    } else {
      callback(null, job);
    }
  });
}

// return a function that finds and
// executes the correct job class

Job.processor = function processor(type) {
  return function(job, done) {
    // validate type
    var jobClass = Job[type];
    if(!jobClass) {
      return done("Unsupported job type");
    }
    
    var job = new jobClass(job);
    job.process(done);
  }
}

Job.key = function key(name) {
  return 'transcode:' + name;
}