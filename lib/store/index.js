
/*!
 * transkode
 * Copyright (c) 2011 Evan Owen <kainosnoema@gmail.com>
 * MIT Licensed
 */

var Store = module.exports;

Store.local = require('./local')
Store.cloudfiles = require('./cloudfiles')

Store.parse = function(inOut) {
  var store;
  [ 'local', 'cloudfiles' ].forEach(function(name) {
    if(name in inOut) {
      store = new (Store[name])(inOut['filename'], inOut[name]);
    }
  });
  
  return store;
}