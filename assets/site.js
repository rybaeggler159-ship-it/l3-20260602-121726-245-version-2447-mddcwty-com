(function() {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var mobilePanel = document.querySelector("[data-mobile-panel]");
  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function() {
      mobilePanel.classList.toggle("open");
    });
  }

  var hero = document.querySelector("[data-hero-slider]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dots button"));
    var current = 0;
    var showSlide = function(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, idx) {
        slide.classList.toggle("active", idx === current);
      });
      dots.forEach(function(dot, idx) {
        dot.classList.toggle("active", idx === current);
      });
    };
    dots.forEach(function(dot, idx) {
      dot.addEventListener("click", function() {
        showSlide(idx);
      });
    });
    if (slides.length > 1) {
      window.setInterval(function() {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var filterWraps = Array.prototype.slice.call(document.querySelectorAll("[data-filter-wrap]"));
  filterWraps.forEach(function(wrap) {
    var input = wrap.querySelector("[data-filter-input]");
    var year = wrap.querySelector("[data-filter-year]");
    var genre = wrap.querySelector("[data-filter-genre]");
    var cards = Array.prototype.slice.call(wrap.querySelectorAll(".movie-card"));
    var empty = wrap.querySelector(".empty-state");
    var applyFilter = function() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var y = year ? year.value : "";
      var g = genre ? genre.value : "";
      var visible = 0;
      cards.forEach(function(card) {
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-region")
        ].join(" ").toLowerCase();
        var matchQ = !q || text.indexOf(q) >= 0;
        var matchY = !y || card.getAttribute("data-year") === y;
        var matchG = !g || (card.getAttribute("data-genre") || "").indexOf(g) >= 0;
        var ok = matchQ && matchY && matchG;
        card.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("show", visible === 0);
      }
    };
    [input, year, genre].forEach(function(node) {
      if (node) {
        node.addEventListener("input", applyFilter);
        node.addEventListener("change", applyFilter);
      }
    });
  });

  var searchRoot = document.querySelector("[data-search-root]");
  if (searchRoot && window.SEARCH_MOVIES) {
    var form = searchRoot.querySelector("[data-search-form]");
    var input = searchRoot.querySelector("[data-search-box]");
    var results = searchRoot.querySelector("[data-search-results]");
    var empty = searchRoot.querySelector(".empty-state");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (input) {
      input.value = initial;
    }
    var render = function(list) {
      results.innerHTML = "";
      list.slice(0, 180).forEach(function(item) {
        var tags = (item.tags || []).slice(0, 3).map(function(tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        var article = document.createElement("article");
        article.className = "movie-card";
        article.setAttribute("data-title", item.title);
        article.setAttribute("data-year", item.year);
        article.setAttribute("data-genre", item.genre);
        article.setAttribute("data-region", item.region);
        article.innerHTML = [
          '<a class="poster" href="' + item.url + '" aria-label="' + escapeHtml(item.title) + '">',
          '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy" onerror="this.style.display=\\'none\\'; this.parentElement.classList.add(\\'cover-fallback\\');">',
          '<span class="play-badge">▶</span>',
          '<span class="year-badge">' + escapeHtml(item.year) + '</span>',
          '</a>',
          '<div class="card-body">',
          '<a class="card-title" href="' + item.url + '">' + escapeHtml(item.title) + '</a>',
          '<p>' + escapeHtml(item.oneLine || "") + '</p>',
          '<div class="tag-row">' + tags + '</div>',
          '</div>'
        ].join("");
        results.appendChild(article);
      });
      if (empty) {
        empty.classList.toggle("show", list.length === 0);
      }
    };
    var run = function() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var list = window.SEARCH_MOVIES.filter(function(item) {
        if (!q) {
          return true;
        }
        return [
          item.title,
          item.year,
          item.genre,
          item.region,
          item.type,
          item.category,
          (item.tags || []).join(" "),
          item.oneLine
        ].join(" ").toLowerCase().indexOf(q) >= 0;
      });
      render(list);
    };
    if (form) {
      form.addEventListener("submit", function(event) {
        event.preventDefault();
        run();
      });
    }
    if (input) {
      input.addEventListener("input", run);
    }
    run();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
  players.forEach(function(shell) {
    var video = shell.querySelector("video");
    var button = shell.querySelector("[data-play-button]");
    var url = shell.getAttribute("data-video-url");
    var started = false;
    var start = function() {
      if (!video || !url) {
        return;
      }
      if (!started) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          video.src = url;
        }
        started = true;
      }
      shell.classList.add("playing");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function() {
          shell.classList.remove("playing");
        });
      }
    };
    if (button) {
      button.addEventListener("click", start);
    }
    if (video) {
      video.addEventListener("click", function() {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener("play", function() {
        shell.classList.add("playing");
      });
      video.addEventListener("pause", function() {
        if (video.currentTime === 0) {
          shell.classList.remove("playing");
        }
      });
    }
  });
})();
