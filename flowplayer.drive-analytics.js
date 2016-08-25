/*!

   Drive analytics plugin for Flowplayer HTML5

   Copyright (c) 2016, Flowplayer Oy

   Released under the ISC License:
   https://opensource.org/licenses/ISC

*/
(function() {
  /* global flowplayer */

  function track(src, time, playerVersion, p2p, finished, cb) {
    var trackerUrl = getTrackerURL(src);
    if (!trackerUrl) return;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', trackerUrl);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) cb(new Error('Request error'));
    };
    xhr.send(JSON.stringify({ play: {
      src: src,
      seconds: time,
      p2p: p2p,
      playerVersion: playerVersion,
      finished: !!finished
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
        player.one(player.conf.splash ? 'progress' : 'resume', function() {
          track(video.src, 0, flowplayer.version, false, false, _cbHandler);
          nextProgess = 5;
          player.on('progress.drivetrack', function(_ev, _api, time) {
            if (time < nextProgess) return;
            track(player.video.src, nextProgess, flowplayer.version, null, false, _cbHandler);
            nextProgess += 5;
          });
          player.on('finish.drivetrack', function() {
            track(player.video.src, player.video.duration, flowplayer.version, null, true, _cbHandler);
          });
        });
      });
    });
  };

  if (typeof module === 'object' && module.exports) module.exports = extension;
  else if (typeof flowplayer === 'function') extension(flowplayer);

  function getTrackerURL(src) {
    var a = document.createElement('a');
    a.href = src;
    var productionUrls = ['cdn.flowplayer.org', 'drive.flowplayer.org']
      , devUrls = ['cdn.dev.flowplayer.org'];
    if (productionUrls.indexOf(a.hostname) !== -1) return 'https://api.flowplayer.org/events/play';
    if (devUrls.indexOf(a.hostname) !== -1) return 'https://api.flowplayer.org/events/dev/play';
  }
})();
