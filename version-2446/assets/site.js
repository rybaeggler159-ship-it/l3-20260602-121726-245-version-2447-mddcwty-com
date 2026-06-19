(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function getQuery(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
      }[char];
    });
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var panel = document.querySelector(".mobile-nav-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }
    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(i);
        start();
      });
    });
    start();
  }

  function setupBackTop() {
    document.querySelectorAll(".back-top").forEach(function (button) {
      button.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function setupPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (box) {
      var video = box.querySelector("video");
      var overlay = box.querySelector(".player-overlay");
      if (!video || !overlay) {
        return;
      }
      var hls = null;
      var stream = video.getAttribute("data-stream");
      function attachStream() {
        if (video.dataset.ready === "1") {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          overlay.innerHTML = '<span class="player-message">播放加载失败，请稍后再试</span>';
          return;
        }
        video.dataset.ready = "1";
      }
      function play() {
        attachStream();
        overlay.classList.add("is-hidden");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            overlay.classList.remove("is-hidden");
          });
        }
      }
      overlay.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
          overlay.classList.remove("is-hidden");
        }
      });
      video.addEventListener("play", function () {
        overlay.classList.add("is-hidden");
      });
      video.addEventListener("pause", function () {
        overlay.classList.remove("is-hidden");
      });
      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
          hls = null;
        }
      });
    });
  }

  function setupCategoryBrowser() {
    document.querySelectorAll("[data-category-browser]").forEach(function (browser) {
      var container = browser.querySelector("[data-card-container]");
      var filter = browser.querySelector("[data-card-filter]");
      var sort = browser.querySelector("[data-card-sort]");
      if (!container) {
        return;
      }
      var cards = Array.prototype.slice.call(container.querySelectorAll(".movie-card"));
      function apply() {
        var query = normalizeText(filter ? filter.value : "");
        cards.forEach(function (card) {
          var title = normalizeText(card.dataset.title);
          card.style.display = !query || title.indexOf(query) !== -1 ? "" : "none";
        });
        var sorted = cards.slice();
        var mode = sort ? sort.value : "default";
        if (mode === "heat") {
          sorted.sort(function (a, b) {
            return Number(b.dataset.heat || 0) - Number(a.dataset.heat || 0);
          });
        }
        if (mode === "year") {
          sorted.sort(function (a, b) {
            return String(b.dataset.year || "").localeCompare(String(a.dataset.year || ""), "zh-Hans-CN");
          });
        }
        if (mode === "title") {
          sorted.sort(function (a, b) {
            return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
          });
        }
        sorted.forEach(function (card) {
          container.appendChild(card);
        });
      }
      if (filter) {
        filter.addEventListener("input", apply);
      }
      if (sort) {
        sort.addEventListener("change", apply);
      }
    });
  }

  function renderSearchCard(movie) {
    return '' +
      '<article class="movie-card">' +
      '<a class="movie-poster" href="' + escapeHtml(movie.href) + '">' +
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="poster-chip">' + escapeHtml(movie.category) + '</span>' +
      '<span class="poster-year">' + escapeHtml(movie.year) + '</span>' +
      '<span class="play-hover">▶</span>' +
      '</a>' +
      '<div class="movie-card-body">' +
      '<h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '<p>' + escapeHtml(movie.oneLine) + '</p>' +
      '<div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>' +
      '</div>' +
      '</article>';
  }

  function setupSearchPage() {
    var target = document.querySelector("[data-search-results]");
    var summary = document.querySelector("[data-search-summary]");
    if (!target || !window.SEARCH_MOVIES) {
      return;
    }
    var query = getQuery("q");
    var field = document.querySelector(".page-search input[name='q']");
    if (field) {
      field.value = query;
    }
    var normalized = normalizeText(query);
    var results = window.SEARCH_MOVIES.filter(function (movie) {
      if (!normalized) {
        return true;
      }
      var haystack = [
        movie.title,
        movie.category,
        movie.region,
        movie.type,
        movie.genre,
        movie.oneLine,
        (movie.tags || []).join(" ")
      ].join(" ");
      return normalizeText(haystack).indexOf(normalized) !== -1;
    });
    results.sort(function (a, b) {
      return Number(b.heat || 0) - Number(a.heat || 0);
    });
    var shown = results.slice(0, 96);
    target.innerHTML = shown.map(renderSearchCard).join("");
    if (summary) {
      summary.textContent = query ? '“' + query + '” 的搜索结果' : "精选内容";
    }
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupBackTop();
    setupPlayers();
    setupCategoryBrowser();
    setupSearchPage();
  });
})();
