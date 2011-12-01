
var Job = require('../job')

exports.createJob = function(req, res, next){
  var data = req.body;

  if(!data) {
    return res.send("No job provided", 406);
  }

  if(!data.title) data.title = "for " + getRemoteAddress(req);

  Job.create(req.params.type, data, function(err, job) {
    if(err) {
      res.send({job: job, error: err}, 406);
    } else {
      res.send({job: job});
    }
  });
};

function getRemoteAddress(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}