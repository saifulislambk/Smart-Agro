const http = require('http');
const origRequest = http.request;
http.request = function (options, cb) {
  if (typeof options === 'object' && options !== null) {
    if (options.port === 3000 || options.port === '3000') {
      options.port = 3098;
    }
  } else if (typeof options === 'string') {
    options = options.replace(':3000', ':3098');
  }
  return origRequest.call(this, options, cb);
};
