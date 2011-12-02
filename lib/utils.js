
var env = process.env.NODE_ENV
  , id = process.env.CLUSTER_WORKER;


exports.extend = function(a, b) {
  for(k in b) {
    a[k] = b[k];
  }
  return a;
}

exports.log = {
  info: function(str) {
    if(env && env != 'development') return;
    var str = Array.prototype.slice.call(arguments).join(' ')
      , name = typeof id != 'undefined' ? 'worker ' + id + ' ' : '';
    console.log('  info \033[92m- %s\033[0m', name + str);
  }
}