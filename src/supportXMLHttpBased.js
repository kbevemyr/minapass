
function makeRequest(opts) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    var url = opts.url;
    if (opts.query) {
       url=url+"?"+opts.query;
    }
    req.open(opts.method, url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status >= 200 && this.status < 300) {
        // Resolve the promise with the response text
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        req.setRequestHeader(key, opts.headers[key]);
      });
    }
    var params = opts.params;
    if (params && typeof params === 'object') {
       params = Object.keys(params).map(function(key) {
         return encodeURIComponent(key) + "=" +
                  encodeURIComponent(params[key]);
       }).join('&');
    }

    if (opts.timeout) {
        console.log("found timeout: "+opts.timeout);
        req.timeout = opts.timeout;
    }

    // Make the request
    req.send(params);
  });
}

function makeJSONRequest(opts) {
  return makeRequest(opts).then(JSON.parse);
}

// get_user
// get?key=
export function serverGet(key, params) {
    var opts =
        { method: "GET",
          url: "https://"+window.location.hostname+"/crossfit/"+key,
        };

    if (params) {
        opts["query"] = Object.keys(params).map(function(key) {
            return encodeURIComponent(key) + "=" +
                encodeURIComponent(params[key]);
        }).join('&');
    }

    return makeJSONRequest(opts);
}


export function serverPost(key, params) {
  console.log("serverPost: "+key);

  var opts =
         { method: "POST",
           url: "https://"+window.location.hostname+"/crossfit/"+key,
           contentType: "application/json",
          };

  if (params) {
    opts["params"] = JSON.stringify(params);
  }

  console.log("serverPost.opts: "+JSON.stringify(opts));

  return makeJSONRequest(opts);
}


export function serverLogin(username, password, remember) {
  var opts =
         { method: "GET",
           url: "https://"+window.location.hostname+"/crossfit/login",
           query:  ("user="+username+
                    "&password="+encodeURIComponent(password)+
                    "&remember="+remember+
                    "&redirect_url="+window.location.href
                  )
         };
  return makeJSONRequest(opts);
}
