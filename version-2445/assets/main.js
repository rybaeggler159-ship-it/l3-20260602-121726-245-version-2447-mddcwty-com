(function () {
  var toggle = document.querySelector('.menu-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var active = 0;

  function showSlide(index) {
    if (!slides.length) return;
    active = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === active);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === active);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showSlide(Number(dot.getAttribute('data-target')) || 0);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(active + 1);
    }, 5200);
  }

  var grid = document.querySelector('.sortable-grid');
  if (grid) {
    var filters = Array.prototype.slice.call(document.querySelectorAll('.filter-select'));
    var sorter = document.querySelector('.sort-select');

    function applyGrid() {
      var cards = Array.prototype.slice.call(grid.children);
      var selected = {};
      filters.forEach(function (filter) {
        selected[filter.getAttribute('data-filter')] = filter.value;
      });
      cards.forEach(function (card) {
        var visible = true;
        Object.keys(selected).forEach(function (key) {
          if (selected[key] && card.getAttribute('data-' + key) !== selected[key]) {
            visible = false;
          }
        });
        card.classList.toggle('hidden-by-filter', !visible);
      });
      if (sorter) {
        var mode = sorter.value;
        cards.sort(function (a, b) {
          if (mode === 'title') {
            return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-Hans-CN');
          }
          return Number(b.getAttribute('data-' + mode) || 0) - Number(a.getAttribute('data-' + mode) || 0);
        });
        cards.forEach(function (card) {
          grid.appendChild(card);
        });
      }
    }

    filters.forEach(function (filter) {
      filter.addEventListener('change', applyGrid);
    });
    if (sorter) {
      sorter.addEventListener('change', applyGrid);
    }
  }

  if (typeof SEARCH_INDEX !== 'undefined') {
    var input = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');
    var hint = document.getElementById('searchHint');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (input) {
      input.value = initial;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char];
      });
    }

    function renderSearch(query) {
      if (!results || !hint) return;
      var q = String(query || '').trim().toLowerCase();
      if (!q) {
        results.innerHTML = '';
        hint.textContent = '输入关键词后显示匹配结果。';
        return;
      }
      var matches = SEARCH_INDEX.filter(function (item) {
        var target = [item.title, item.region, item.type, item.genre, item.year, item.oneLine].concat(item.tags || []).join(' ').toLowerCase();
        return target.indexOf(q) !== -1;
      }).slice(0, 120);
      hint.textContent = matches.length ? '已显示匹配结果。' : '没有找到匹配结果。';
      results.innerHTML = matches.map(function (item) {
        return '<article class="movie-card">' +
          '<a class="poster-wrap" href="' + item.url + '">' +
          '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
          '<span class="play-dot">▶</span>' +
          '</a>' +
          '<div class="movie-info">' +
          '<a class="movie-title" href="' + item.url + '">' + escapeHtml(item.title) + '</a>' +
          '<p>' + escapeHtml(item.oneLine) + '</p>' +
          '<div class="movie-meta"><span>' + item.year + '</span><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
          '</div>' +
          '</article>';
      }).join('');
    }

    renderSearch(initial);
    if (input) {
      input.addEventListener('input', function () {
        renderSearch(input.value);
      });
    }
  }
})();
