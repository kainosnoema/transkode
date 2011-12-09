
var env = process.env.NODE_ENV
  , id = process.env.CLUSTER_WORKER;


exports.extend = function(a, b) {
  for(k in b) {
    a[k] = b[k];
  }
  return a;
};

exports.log = {
  info: function(str) {
    if(env && env != 'development') return;
    var str = Array.prototype.slice.call(arguments).join(' ')
      , name = typeof id != 'undefined' ? 'worker ' + id + ' ' : '';
    console.log('  info \033[92m- %s\033[0m', name + str);
  }
};

/**
 * Buffer `data` and `end` events from the given stream `obj`.
 *
 * @param {Stream} obj
 * @api public
 */

// __Attribution:__ Taken from node-http-proxy's stream buffer implementation
// https://github.com/nodejitsu/node-http-proxy/blob/master/lib/node-http-proxy.js#L223-256

exports.buffer = function (obj) {
  var events = [],
      onData, 
      onEnd
      length = 0;

  obj.on('data', onData = function (data, encoding) {
    length += data.length;
    events.push(['data', data, encoding]);
  });

  obj.on('end', onEnd = function (data, encoding) {
    events.push(['end', data, encoding]);
  });

  return {
    end: function () {
      obj.removeListener('data', onData);
      obj.removeListener('end', onEnd);
    }
  , destroy: function () {
      this.end();
      this.resume = function () {
        console.error("Cannot resume buffer after destroying it.");
      };

      onData = onEnd = events = obj = null;
    }
  , resume: function () {
      this.end();
      for (var i = 0, len = events.length; i < len; ++i) {
        obj.emit.apply(obj, events[i]);
      }
    }
  , length: function() {
      return length;
    }
  };
};