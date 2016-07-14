(function() {
  /* global flowplayer */

  function track(src, time, playerVersion, p2p, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.flowplayer.org/events/play');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) cb(new Error('Request error'));
    };
    xhr.send(JSON.stringify({ play: {
      src: src,
      seconds: time,
      p2p: p2p,
      playerVersion: playerVersion
    }}));
  }

  var extension = function(flowplayer) {
    flowplayer(function(player) {
      var nextProgess;

      function _cbHandler(err) {
        if (err) {
          player.off('.drivetrack'); // Don't bombard the API if it's down
        }
      }

      player.on('ready', function(_ev, _api, video) {
        player.one('resume', function() {
          track(video.src, 0, flowplayer.version, false, _cbHandler);
          nextProgess = 5;
          player.on('progress.drivetrack', function(_ev, _api, time) {
            if (time < nextProgess) return;
            track(player.video.src, nextProgess, flowplayer.version, null, _cbHandler);
            nextProgess += 5;
          });
          player.on('finish.drivetrack', function() {
            track(player.video.src, player.video.duration, flowplayer.version, null, _cbHandler);
          });
        });
      });
    });
  };

  if (typeof module === 'object' && module.exports) module.exports = extension;
  else if (typeof flowplayer === 'function') extension(flowplayer);
})();
