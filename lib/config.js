/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , utils = require('./utils')

var env = process.env.NODE_ENV || 'development'
  , loaded = false;

var config = module.exports = {
  env: env
, load: function(configPath) {
    if(loaded) return;
    
    configPath = normalizePath(configPath);
    
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

// weird workaround to cluster process.cwd() inconsistencies
function normalizePath(filePath) {
  if(process.env.TRANSCODER_CONFIG_PATH) {
    return process.env.TRANSCODER_CONFIG_PATH;
  }
  if(filePath[0] != '/') filePath = path.join(process.cwd(), filePath);
  return process.env.TRANSCODER_CONFIG_PATH = filePath;
}