import { H as Hls } from "./hls.js";

function setMessage(player, message) {
  var messageBox = player.querySelector(".player-message");
  if (messageBox) {
    messageBox.textContent = message || "";
  }
}

function attachHls(video, source, player) {
  if (!source) {
    setMessage(player, "暂无可用播放地址");
    return null;
  }

  if (Hls && Hls.isSupported()) {
    var hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false
    });

    hls.loadSource(source);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      setMessage(player, "");
    });

    hls.on(Hls.Events.ERROR, function (eventName, data) {
      if (!data || !data.fatal) {
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        setMessage(player, "网络连接异常，正在重新加载视频...");
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        setMessage(player, "媒体解码异常，正在尝试恢复播放...");
        hls.recoverMediaError();
        return;
      }

      setMessage(player, "当前浏览器无法播放该视频源");
      hls.destroy();
    });

    return hls;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = source;
    return null;
  }

  setMessage(player, "当前浏览器不支持 HLS 播放");
  return null;
}

function initStaticPlayer(player) {
  var video = player.querySelector("video");
  var overlay = player.querySelector(".player-overlay");

  if (!video) {
    return;
  }

  var source = video.getAttribute("data-src");
  var hls = attachHls(video, source, player);

  function playVideo() {
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        setMessage(player, "请再次点击播放按钮开始观看");
      });
    }
  }

  if (overlay) {
    overlay.addEventListener("click", playVideo);
  }

  video.addEventListener("play", function () {
    player.classList.add("is-playing");
    setMessage(player, "");
  });

  video.addEventListener("pause", function () {
    player.classList.remove("is-playing");
  });

  video.addEventListener("ended", function () {
    player.classList.remove("is-playing");
  });

  window.addEventListener("beforeunload", function () {
    if (hls && typeof hls.destroy === "function") {
      hls.destroy();
    }
  });
}

function initPlayers() {
  var players = document.querySelectorAll("[data-player]");
  players.forEach(initStaticPlayer);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPlayers);
} else {
  initPlayers();
}
