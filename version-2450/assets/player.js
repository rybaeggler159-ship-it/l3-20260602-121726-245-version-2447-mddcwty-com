import { H as Hls } from './hls-dru42stk.js';

document.addEventListener('DOMContentLoaded', function () {
  const players = Array.from(document.querySelectorAll('.js-player'));

  players.forEach(function (video) {
    const source = video.dataset.src;
    const wrapper = video.closest('.player-card');
    const playButton = wrapper ? wrapper.querySelector('[data-play-button]') : null;

    if (!source) {
      return;
    }

    setupHls(video, source);

    if (playButton) {
      playButton.addEventListener('click', function () {
        video.play().catch(function () {
          video.controls = true;
        });
      });

      video.addEventListener('play', function () {
        playButton.classList.add('is-hidden');
      });

      video.addEventListener('pause', function () {
        playButton.classList.remove('is-hidden');
      });
    }
  });
});

function setupHls(video, source) {
  if (Hls && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });

    hls.loadSource(source);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, function (_event, data) {
      if (!data || !data.fatal) {
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      hls.destroy();
    });

    return;
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
  }
}
