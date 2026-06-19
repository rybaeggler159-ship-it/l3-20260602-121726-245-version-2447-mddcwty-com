import { H as Hls } from './hls.js';

(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('.movie-player'));

  players.forEach(function (player) {
    var video = player.querySelector('video');
    var button = player.querySelector('.play-overlay');
    if (!video || !button) return;

    var url = video.getAttribute('data-video-url');
    var ready = false;
    var hls = null;

    function attachSource() {
      if (ready || !url) return;
      ready = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }
    }

    function startPlayback() {
      attachSource();
      button.classList.add('is-hidden');
      video.setAttribute('controls', 'controls');
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          button.classList.remove('is-hidden');
        });
      }
    }

    button.addEventListener('click', startPlayback);
    video.addEventListener('click', function () {
      if (video.paused) {
        startPlayback();
      }
    });
    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });
    video.addEventListener('ended', function () {
      button.classList.remove('is-hidden');
      if (hls && typeof hls.stopLoad === 'function') {
        hls.stopLoad();
      }
    });
  });
})();
