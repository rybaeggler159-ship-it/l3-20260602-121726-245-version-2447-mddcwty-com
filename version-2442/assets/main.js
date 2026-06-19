
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupNav() {
    var button = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (!button || !menu) return;
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) return;
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (timer) window.clearInterval(timer);
        show(i);
        start();
      });
    });

    show(0);
    start();
  }

  function setupFilters() {
    var filterBars = Array.prototype.slice.call(document.querySelectorAll(".filter-bar"));
    filterBars.forEach(function (bar) {
      var input = bar.querySelector("[data-filter-input]");
      var select = bar.querySelector("[data-filter-select]");
      var sort = bar.querySelector("[data-sort-select]");
      var scope = document.querySelector(bar.getAttribute("data-target") || ".movie-grid");
      var empty = document.querySelector(bar.getAttribute("data-empty") || ".empty-state");
      if (!scope) return;
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var typeValue = select ? select.value : "all";
        var visible = 0;
        cards.forEach(function (card) {
          var title = (card.getAttribute("data-title") || "").toLowerCase();
          var region = (card.getAttribute("data-region") || "").toLowerCase();
          var type = card.getAttribute("data-type") || "";
          var matchedText = !keyword || title.indexOf(keyword) > -1 || region.indexOf(keyword) > -1;
          var matchedType = typeValue === "all" || type === typeValue;
          var show = matchedText && matchedType;
          card.style.display = show ? "" : "none";
          if (show) visible += 1;
        });
        if (empty) empty.style.display = visible ? "none" : "block";
      }

      function resort() {
        if (!sort) return;
        var mode = sort.value;
        cards.sort(function (a, b) {
          if (mode === "year") {
            return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
          }
          if (mode === "hot") {
            return Number(b.getAttribute("data-hot")) - Number(a.getAttribute("data-hot"));
          }
          return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-CN");
        });
        cards.forEach(function (card) {
          scope.appendChild(card);
        });
        apply();
      }

      if (input) input.addEventListener("input", apply);
      if (select) select.addEventListener("change", apply);
      if (sort) sort.addEventListener("change", resort);
      resort();
      apply();
    });
  }

  window.initMoviePlayer = function (videoId, layerId, buttonId, sourceUrl) {
    var video = document.getElementById(videoId);
    var layer = document.getElementById(layerId);
    var button = document.getElementById(buttonId);
    if (!video || !sourceUrl) return;
    var loaded = false;
    var hlsInstance = null;

    function attach() {
      if (loaded) return;
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && Hls.isSupported()) {
        hlsInstance = new Hls({
          maxBufferLength: 45,
          enableWorker: true
        });
        hlsInstance.loadSource(sourceUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
    }

    function play() {
      attach();
      if (layer) layer.classList.add("is-hidden");
      var action = video.play();
      if (action && action.catch) action.catch(function () {});
    }

    if (layer) layer.addEventListener("click", play);
    if (button && button !== layer) button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (!loaded || video.paused) play();
    });
    video.addEventListener("play", function () {
      if (layer) layer.classList.add("is-hidden");
    });
    video.addEventListener("emptied", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      loaded = false;
    });
  };

  ready(function () {
    setupNav();
    setupHero();
    setupFilters();
  });
})();
