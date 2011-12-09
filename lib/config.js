var fs = require('fs')
  , path = require('path')

var env = process.env.NODE_ENV || 'development'
  , configPath = process.env.TRANSCODER_CONFIG_PATH
  , configObj;

if(configPath) {
  try {
   configObj = JSON.parse(fs.readFileSync(configPath));
   configObj = configObj[env];
  } catch(e) {
    console.error('Unable to load config.json: ' + e.message);
  }
}

configObj || (configObj = {});

var config = module.exports = {
  cloudfiles: configObj['cloudfiles']
, env: env
}