var fs = require('fs')
  , path = require('path')
  , utils = require('./utils')

var env = process.env.NODE_ENV || 'development'
  , loaded = false;

var config = module.exports = {
  env: env
, load: function(configPath) {
    if(loaded || !configPath) return;

    var configObj;
    try {
     configObj = JSON.parse(fs.readFileSync(configPath));
     configObj = configObj[env] || {};
     utils.extend(this, configObj);
     loaded = true;
    } catch(e) {
      if(e.code == 'EBADF') {
        console.error('Config file not found: ' + configPath);
      } else {
        console.error('Unable to load config file: ' + e.message);
      }
    }
  }
}