/*!

   Drive analytics plugin for Flowplayer HTML5

   Copyright (c) 2016, Flowplayer Oy

   Released under the ISC License:
   https://opensource.org/licenses/ISC

*/
(function() {
  /* global flowplayer, xflow */

  var extension = function(flowplayer) {
    flowplayer(function(player) {
      var nextProgess;

      function _cbHandler(err) {
        if (err) {
          player.off('.drivetrack'); // Don't bombard the API if it's down
        }
      }

      player.on('ready', function(_ev, _api, video) {
        var p2pTick = 0;
        if (typeof xflow !== 'undefined') xflow.Broker.on(xflow.Events.STATS, function(stats) {
          if (!stats.p2p) return;
          p2pTick += stats.loaded;
        });
        player.one(player.conf.splash ? 'progress' : 'resume', function() {
          track(video.src, 0, flowplayer.version, false, _cbHandler);
          nextProgess = 5;
          player.on('progress.drivetrack', function(_ev, _api, time) {
            if (time < nextProgess) return;
            track(player.video.src, nextProgess, flowplayer.version, false, _cbHandler);
            nextProgess += 5;
          });
          player.on('finish.drivetrack', function() {
            track(player.video.src, player.video.duration, flowplayer.version, true, _cbHandler);
            player.one('resume', function() {
              track(video.src, 0, flowplayer.version, false, _cbHandler);
              nextProgess = 5;
            });
          });
          player.on('seek', function(_, __, time) {
            nextProgess = Math.ceil(time/5)*5;
          });
        });
        function track(src, time, playerVersion, finished, cb) {
          if (typeof time !== 'number' || !isFinite(time)) return;
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
            p2pBytes: p2pTick,
            playerVersion: playerVersion,
            finished: !!finished
          }}));
          p2pTick = 0;
        }
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
