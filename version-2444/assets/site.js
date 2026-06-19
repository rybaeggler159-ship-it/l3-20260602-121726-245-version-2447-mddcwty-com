(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMobileMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var panel = document.querySelector(".mobile-panel");

    if (!button || !panel) {
      return;
    }

    button.addEventListener("click", function () {
      var isOpen = panel.hasAttribute("hidden");
      if (isOpen) {
        panel.removeAttribute("hidden");
        button.setAttribute("aria-expanded", "true");
        button.textContent = "×";
        document.body.classList.add("menu-open");
      } else {
        panel.setAttribute("hidden", "");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "☰";
        document.body.classList.remove("menu-open");
      }
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initImageFallbacks() {
    var images = document.querySelectorAll(".poster-frame img");
    images.forEach(function (image) {
      image.addEventListener("error", function () {
        var frame = image.closest(".poster-frame");
        if (frame) {
          frame.classList.add("image-missing");
        }
        image.remove();
      });
    });
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function initFilters() {
    var panels = document.querySelectorAll("[data-filter-panel]");

    panels.forEach(function (panel) {
      var root = panel.parentElement || document;
      var input = panel.querySelector(".movie-filter-input");
      var category = panel.querySelector(".movie-filter-category");
      var year = panel.querySelector(".movie-filter-year");
      var reset = panel.querySelector(".filter-reset");
      var status = panel.querySelector(".filter-status");
      var cards = Array.prototype.slice.call(root.querySelectorAll(".movie-card"));
      var initialQuery = getQueryParam("q");

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function applyFilter() {
        var keyword = normalize(input && input.value);
        var selectedCategory = normalize(category && category.value);
        var selectedYear = normalize(year && year.value);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search"));
          var cardCategory = normalize(card.getAttribute("data-category"));
          var cardYear = normalize(card.getAttribute("data-year"));
          var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchedCategory = !selectedCategory || cardCategory === selectedCategory;
          var matchedYear = !selectedYear || cardYear === selectedYear;
          var visible = matchedKeyword && matchedCategory && matchedYear;

          card.classList.toggle("is-hidden", !visible);
          if (visible) {
            visibleCount += 1;
          }
        });

        if (status) {
          status.textContent = visibleCount > 0 ? "已显示匹配内容" : "没有找到匹配内容";
        }
      }

      [input, category, year].forEach(function (element) {
        if (!element) {
          return;
        }
        element.addEventListener("input", applyFilter);
        element.addEventListener("change", applyFilter);
      });

      if (reset) {
        reset.addEventListener("click", function () {
          if (input) {
            input.value = "";
          }
          if (category && category.tagName === "SELECT") {
            category.value = "";
          }
          if (year) {
            year.value = "";
          }
          applyFilter();
        });
      }

      applyFilter();
    });
  }

  function initScrollPlayerLinks() {
    var links = document.querySelectorAll("[data-scroll-player]");
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var player = document.querySelector("[data-player]");
        if (player) {
          event.preventDefault();
          player.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  }

  ready(function () {
    initMobileMenu();
    initHeroSlider();
    initImageFallbacks();
    initFilters();
    initScrollPlayerLinks();
  });
})();
