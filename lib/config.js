var fs = require('fs')
  , path = require('path')

var env = process.env.NODE_ENV || 'development'
  , configObj;
try {
 configObj = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')));
 configObj = configObj[env];
} catch(e) {
  console.error('unable to load config.json: ' + e.message);
}

configObj || (configObj = {});

var config = module.exports = {
  cloudfiles: configObj['cloudfiles']
, env: env
}