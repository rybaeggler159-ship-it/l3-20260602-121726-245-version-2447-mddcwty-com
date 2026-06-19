(function () {
  const mobileButton = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (mobileButton && mobileMenu) {
    mobileButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  const searchPanel = document.querySelector('[data-search-panel]');
  const openSearchButtons = document.querySelectorAll('[data-open-search]');
  const closeSearchButton = document.querySelector('[data-close-search]');
  const globalSearchInput = document.querySelector('[data-global-search]');
  const globalResults = document.querySelector('[data-global-results]');

  function openSearch() {
    if (!searchPanel) {
      return;
    }

    searchPanel.classList.add('is-open');
    if (globalSearchInput) {
      globalSearchInput.focus();
    }
  }

  function closeSearch() {
    if (!searchPanel) {
      return;
    }

    searchPanel.classList.remove('is-open');
  }

  openSearchButtons.forEach(function (button) {
    button.addEventListener('click', openSearch);
  });

  if (closeSearchButton) {
    closeSearchButton.addEventListener('click', closeSearch);
  }

  function renderGlobalResults(keyword) {
    if (!globalResults) {
      return;
    }

    const value = keyword.trim().toLowerCase();
    const source = window.SITE_SEARCH_INDEX || [];

    if (!value) {
      globalResults.innerHTML = '';
      return;
    }

    const results = source.filter(function (item) {
      return item.text.toLowerCase().includes(value);
    }).slice(0, 18);

    globalResults.innerHTML = results.map(function (item) {
      return '<a href="' + item.url + '"><strong>' + item.title + '</strong><span>' + item.year + ' · ' + item.region + ' · ' + item.category + '</span></a>';
    }).join('');
  }

  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', function (event) {
      renderGlobalResults(event.target.value);
    });
  }

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;

    function activate(index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        activate(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        activate((current + 1) % slides.length);
      }, 5200);
    }
  });

  document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
    const form = scope.querySelector('[data-filter-form]');
    const cards = Array.from(scope.querySelectorAll('[data-filter-card]'));
    const emptyTip = scope.querySelector('[data-empty-tip]');

    if (!form || cards.length === 0) {
      return;
    }

    const keywordInput = form.querySelector('[data-filter-keyword]');
    const regionSelect = form.querySelector('[data-filter-region]');
    const yearSelect = form.querySelector('[data-filter-year]');
    const categorySelect = form.querySelector('[data-filter-category]');

    function applyFilter() {
      const keyword = (keywordInput ? keywordInput.value : '').trim().toLowerCase();
      const region = regionSelect ? regionSelect.value : '';
      const year = yearSelect ? yearSelect.value : '';
      const category = categorySelect ? categorySelect.value : '';
      let visible = 0;

      cards.forEach(function (card) {
        const text = (card.dataset.text || '').toLowerCase();
        const cardRegion = card.dataset.region || '';
        const cardYear = card.dataset.year || '';
        const cardCategory = card.dataset.category || '';
        const matched = (!keyword || text.includes(keyword)) && (!region || cardRegion === region) && (!year || cardYear === year) && (!category || cardCategory === category);
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (emptyTip) {
        emptyTip.classList.toggle('is-visible', visible === 0);
      }
    }

    [keywordInput, regionSelect, yearSelect, categorySelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
  });

  document.querySelectorAll('[data-player]').forEach(function (player) {
    const video = player.querySelector('video');
    const playButton = player.querySelector('[data-play-button]');
    const message = player.querySelector('[data-player-message]');
    const source = player.dataset.source;
    let initialized = false;
    let hlsInstance = null;

    function showMessage(text) {
      if (!message) {
        return;
      }

      message.textContent = text;
      message.classList.add('is-visible');
    }

    function attachSource() {
      if (!video || initialized) {
        return;
      }

      initialized = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage('视频加载失败，请稍后重试');
          }
        });
        return;
      }

      showMessage('当前浏览器暂不支持播放');
    }

    function startPlayback() {
      if (!video) {
        return;
      }

      attachSource();
      video.setAttribute('controls', 'controls');
      if (playButton) {
        playButton.classList.add('is-hidden');
      }

      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (playButton) {
            playButton.classList.remove('is-hidden');
          }
        });
      }
    }

    if (playButton) {
      playButton.addEventListener('click', startPlayback);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener('play', function () {
        if (playButton) {
          playButton.classList.add('is-hidden');
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
