(function () {
    'use strict';

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var toggle = $('[data-menu-toggle]');
        var panel = $('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function setupHeroCarousel() {
        var root = $('[data-hero-carousel]');
        if (!root) {
            return;
        }
        var slides = $all('[data-hero-slide]', root);
        var dots = $all('[data-hero-dot]', root);
        var prev = $('[data-hero-prev]', root);
        var next = $('[data-hero-next]', root);
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
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

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupFilterPanels() {
        $all('[data-filter-panel]').forEach(function (panel) {
            var list = panel.parentElement ? $('.filter-list', panel.parentElement) : null;
            if (!list) {
                return;
            }
            var items = $all('.filter-item', list);
            var keyword = $('[data-filter-keyword]', panel);
            var type = $('[data-filter-type]', panel);
            var year = $('[data-filter-year]', panel);
            var count = $('[data-filter-count]', panel);

            function apply() {
                var keywordValue = keyword ? keyword.value.trim().toLowerCase() : '';
                var typeValue = type ? type.value : '';
                var yearValue = year ? year.value : '';
                var visible = 0;

                items.forEach(function (item) {
                    var haystack = [
                        item.getAttribute('data-title') || '',
                        item.getAttribute('data-region') || '',
                        item.getAttribute('data-type') || '',
                        item.getAttribute('data-year') || '',
                        item.getAttribute('data-genre') || '',
                        item.getAttribute('data-tags') || ''
                    ].join(' ').toLowerCase();
                    var matchKeyword = !keywordValue || haystack.indexOf(keywordValue) !== -1;
                    var matchType = !typeValue || (item.getAttribute('data-type') || '') === typeValue;
                    var matchYear = !yearValue || (item.getAttribute('data-year') || '') === yearValue;
                    var isVisible = matchKeyword && matchType && matchYear;
                    item.hidden = !isVisible;
                    if (isVisible) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = visible + ' 部';
                }
            }

            [keyword, type, year].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });

            apply();
        });
    }

    function createSearchCard(movie) {
        var article = document.createElement('article');
        article.className = 'movie-card movie-card-normal';
        article.innerHTML = [
            '<a class="poster-wrap" href="' + movie.url + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
            '    <img src="./' + movie.cover + '" alt="' + escapeHtml(movie.title) + ' 海报" loading="lazy" onerror="this.closest(\'.poster-wrap\').classList.add(\'missing-cover\'); this.remove();">',
            '    <span class="missing-cover-text">' + escapeHtml(movie.title.slice(0, 2)) + '</span>',
            '    <span class="card-badge">' + escapeHtml(movie.category) + '</span>',
            '    <span class="play-float" aria-hidden="true">▶</span>',
            '    <span class="poster-meta"><span>★ ' + movie.rating + '</span><span>' + escapeHtml(movie.views) + '</span></span>',
            '</a>',
            '<div class="card-body">',
            '    <h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
            '    <p>' + escapeHtml(movie.oneLine) + '</p>',
            '    <div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
            '</div>'
        ].join('');
        return article;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setupSearchPage() {
        var app = $('[data-search-app]');
        var results = $('[data-search-results]');
        if (!app || !results || !window.MOVIE_SEARCH_DATA) {
            return;
        }
        var input = $('[data-search-input]', app);
        var type = $('[data-search-type]', app);
        var category = $('[data-search-category]', app);
        var count = $('[data-search-count]', app);
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        if (input && initial) {
            input.value = initial;
        }

        function render() {
            var keyword = input ? input.value.trim().toLowerCase() : '';
            var typeValue = type ? type.value : '';
            var categoryValue = category ? category.value : '';
            var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
                var haystack = [
                    movie.title,
                    movie.category,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' ').toLowerCase();
                return (!keyword || haystack.indexOf(keyword) !== -1)
                    && (!typeValue || movie.type === typeValue)
                    && (!categoryValue || movie.category === categoryValue);
            }).slice(0, 120);

            results.innerHTML = '';
            matched.forEach(function (movie) {
                results.appendChild(createSearchCard(movie));
            });
            if (count) {
                count.textContent = matched.length + ' 部';
            }
        }

        [input, type, category].forEach(function (control) {
            if (control) {
                control.addEventListener('input', render);
                control.addEventListener('change', render);
            }
        });
        render();
    }

    function setupPlayers() {
        $all('[data-player]').forEach(function (player) {
            var video = $('video', player);
            var start = $('[data-player-start]', player);
            var errorBox = $('[data-player-error]', player);
            var source = player.getAttribute('data-source');
            var initialized = false;
            var hls = null;

            function showError(message) {
                if (errorBox) {
                    errorBox.hidden = false;
                    errorBox.textContent = message;
                }
            }

            function initialize() {
                if (!video || !source || initialized) {
                    return;
                }
                initialized = true;
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            showError('网络错误，正在重新加载播放源。');
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            showError('媒体解码错误，正在尝试恢复。');
                            hls.recoverMediaError();
                        } else {
                            showError('当前浏览器无法播放此视频源。');
                            hls.destroy();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else {
                    showError('您的浏览器暂不支持 HLS 播放，请更换浏览器后重试。');
                }
            }

            function play() {
                initialize();
                if (!video) {
                    return;
                }
                var promise = video.play();
                player.classList.add('is-playing');
                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {
                        showError('播放被浏览器拦截，请再次点击播放按钮。');
                        player.classList.remove('is-playing');
                    });
                }
            }

            if (start) {
                start.addEventListener('click', play);
            }

            window.addEventListener('beforeunload', function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHeroCarousel();
        setupFilterPanels();
        setupSearchPage();
        setupPlayers();
    });
}());
