document.addEventListener('DOMContentLoaded', function () {
  initializeMobileMenu();
  initializeHeroCarousel();
  initializeSearchPage();
});

function initializeMobileMenu() {
  const button = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-mobile-panel]');

  if (!button || !panel) {
    return;
  }

  button.addEventListener('click', function () {
    panel.classList.toggle('is-open');
  });
}

function initializeHeroCarousel() {
  const carousel = document.querySelector('[data-hero-carousel]');

  if (!carousel) {
    return;
  }

  const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
  const dots = Array.from(carousel.querySelectorAll('[data-slide-button]'));
  const prev = carousel.querySelector('[data-hero-prev]');
  const next = carousel.querySelector('[data-hero-next]');
  let index = 0;
  let timer = null;

  function showSlide(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === index);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }

  function startTimer() {
    stopTimer();
    timer = window.setInterval(function () {
      showSlide(index + 1);
    }, 5200);
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showSlide(Number(dot.dataset.slideButton));
      startTimer();
    });
  });

  if (prev) {
    prev.addEventListener('click', function () {
      showSlide(index - 1);
      startTimer();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      showSlide(index + 1);
      startTimer();
    });
  }

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);
  showSlide(0);
  startTimer();
}

async function initializeSearchPage() {
  const form = document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');

  if (!form || !input || !results || !status) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  input.value = initialQuery;

  let records = [];

  try {
    const response = await fetch('assets/search-index.json');
    records = await response.json();
  } catch (error) {
    status.textContent = '搜索数据暂时无法加载，请通过分类页继续浏览。';
    return;
  }

  function render(query) {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      status.textContent = '默认展示最新影片，输入关键词后将显示匹配结果。';
      return;
    }

    const matched = records.filter(function (item) {
      const haystack = [
        item.title,
        item.year,
        item.region,
        item.type,
        item.genre,
        item.oneLine,
        (item.tags || []).join(' ')
      ].join(' ').toLowerCase();

      return haystack.includes(keyword);
    }).slice(0, 240);

    status.textContent = '找到 ' + matched.length + ' 条相关结果。';
    results.innerHTML = matched.map(renderCard).join('');
  }

  function renderCard(item) {
    const safeTitle = escapeHtml(item.title);
    const safeLine = escapeHtml(item.oneLine);
    const safeRegion = escapeHtml(item.region);
    const safeType = escapeHtml(item.type);
    const safeGenre = escapeHtml(item.genre);
    const tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card movie-card-default">' +
        '<a href="' + item.url + '" class="movie-cover-link" aria-label="观看 ' + safeTitle + '">' +
          '<img src="' + item.cover + '" alt="' + safeTitle + '" loading="lazy">' +
          '<span class="cover-gradient"></span>' +
          '<span class="year-badge">' + item.year + '</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<div class="movie-card-meta"><span>' + safeRegion + '</span><span>' + safeType + '</span></div>' +
          '<h3><a href="' + item.url + '">' + safeTitle + '</a></h3>' +
          '<p>' + safeLine + '</p>' +
          '<div class="tag-line"><span>' + safeGenre + '</span>' + tags + '</div>' +
        '</div>' +
      '</article>';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const query = input.value.trim();
    const url = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
    window.history.replaceState(null, '', url);
    render(query);
  });

  render(initialQuery);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
