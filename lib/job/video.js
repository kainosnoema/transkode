/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

var VideoJob = module.exports = function VideoJob(job) {
  this.job = job;
  this.data = job.data;
};

VideoJob.prototype.process = function process(done) {
  var inputImageFile = this.data.input.from.local;
  console.error(inputImageFile);
  done();
}