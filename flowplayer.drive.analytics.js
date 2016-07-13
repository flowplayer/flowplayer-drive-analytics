(function() {
  /* global flowplayer */

  function track(src, time, playerVersion, p2p, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://flowplayer.org/events');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) cb(new Error('Request error'));
    };
    xhr.send(JSON.stringify({
      src: src,
      seconds: time,
      p2p: p2p,
      playerVersion: playerVersion
    }));
  }

  var extension = function(flowplayer) {
    flowplayer(function(player) {
      var lastProgress, timeout;
      player.on('progress', function(_ev, _api, time) {
        lastProgress = time;
        if (timeout) return;
        timeout = setTimeout(function() {
          track(player.video.src, lastProgress, flowplayer.version, null, function(err) {
            if (err) {
              clearTimeout(timeout);
              timeout = 'error';
            }
          });
          clearTimeout(timeout);
          timeout = null;
        }, 5000);
      });
    });
  };

  if (typeof module === 'object' && module.exports) module.exports = extension;
  else if (typeof flowplayer === 'function') extension(flowplayer);
})();
