document.addEventListener("DOMContentLoaded", function () {
    setupNavigation();
    setupHero();
    setupFilters();
    setupPlayers();
    setupSearchPage();
});

function setupNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!toggle || !nav) {
        return;
    }
    toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
    });
}

function setupHero() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".spotlight-slide"));
    var backgrounds = Array.prototype.slice.call(document.querySelectorAll(".hero-backdrop img"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-spotlight-dot]"));
    if (panels.length === 0) {
        return;
    }
    var index = 0;
    function show(next) {
        index = (next + panels.length) % panels.length;
        panels.forEach(function (panel, panelIndex) {
            panel.classList.toggle("active", panelIndex === index);
        });
        backgrounds.forEach(function (image, imageIndex) {
            image.classList.toggle("active", imageIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("active", dotIndex === index);
        });
    }
    dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
            show(dotIndex);
        });
    });
    show(0);
    window.setInterval(function () {
        show(index + 1);
    }, 5200);
}

function setupFilters() {
    var input = document.querySelector("[data-local-filter]");
    var yearSelect = document.querySelector("[data-year-filter]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    if (!input && !yearSelect) {
        return;
    }
    function apply() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var year = yearSelect ? yearSelect.value : "";
        cards.forEach(function (card) {
            var text = card.getAttribute("data-search") || "";
            var cardYear = card.getAttribute("data-year") || "";
            var matchedQuery = !query || text.indexOf(query) !== -1;
            var matchedYear = !year || cardYear === year;
            card.style.display = matchedQuery && matchedYear ? "" : "none";
        });
    }
    if (input) {
        input.addEventListener("input", apply);
    }
    if (yearSelect) {
        yearSelect.addEventListener("change", apply);
    }
}

function setupPlayers() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-stream]"));
    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            var target = button.getAttribute("data-target");
            var video = document.getElementById(target);
            var url = button.getAttribute("data-stream");
            var shell = button.closest(".player-shell");
            var status = shell ? shell.querySelector(".player-status") : null;
            if (!video || !url) {
                return;
            }
            if (status) {
                status.textContent = "正在连接资源...";
            }
            startVideo(video, url, function (message) {
                if (status) {
                    status.textContent = message;
                }
            });
            button.classList.add("hidden");
        });
    });
}

function loadPlayerLibrary(callback, onError) {
    if (window.Hls) {
        callback();
        return;
    }
    var existing = document.querySelector("script[data-hls-loader]");
    if (existing) {
        existing.addEventListener("load", callback);
        existing.addEventListener("error", onError);
        return;
    }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
    script.async = true;
    script.setAttribute("data-hls-loader", "true");
    script.addEventListener("load", callback);
    script.addEventListener("error", onError);
    document.head.appendChild(script);
}

function startVideo(video, url, setStatus) {
    function playNow() {
        var promise = video.play();
        if (promise && typeof promise.then === "function") {
            promise.then(function () {
                setStatus("正在播放");
            }).catch(function () {
                setStatus("点击视频控件继续播放");
            });
        } else {
            setStatus("正在播放");
        }
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", playNow, { once: true });
        video.load();
        return;
    }
    loadPlayerLibrary(function () {
        if (window.Hls && window.Hls.isSupported()) {
            if (video._hlsInstance) {
                video._hlsInstance.destroy();
            }
            var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            video._hlsInstance = hls;
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                playNow();
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    setStatus("资源暂时无法播放，请稍后再试");
                }
            });
        } else {
            setStatus("资源暂时无法播放，请稍后再试");
        }
    }, function () {
        setStatus("资源暂时无法播放，请稍后再试");
    });
}

function setupSearchPage() {
    var root = document.querySelector("[data-search-root]");
    if (!root || !window.MovieIndex) {
        return;
    }
    var input = root.querySelector("[data-search-input]");
    var results = root.querySelector("[data-search-results]");
    var empty = root.querySelector("[data-search-empty]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (input) {
        input.value = initial;
    }
    function render() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var matched = window.MovieIndex.filter(function (item) {
            if (!query) {
                return true;
            }
            return item.text.indexOf(query) !== -1;
        }).slice(0, 96);
        if (results) {
            results.innerHTML = matched.map(renderSearchCard).join("");
        }
        if (empty) {
            empty.style.display = matched.length ? "none" : "block";
        }
    }
    if (input) {
        input.addEventListener("input", render);
    }
    render();
}

function renderSearchCard(item) {
    return [
        '<article class="movie-card">',
        '<a class="movie-poster" href="' + item.url + '">',
        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '<span class="score">' + item.rating + '</span>',
        '</a>',
        '<div class="movie-info">',
        '<div class="movie-meta"><span>' + item.year + '</span><span>' + escapeHtml(item.type) + '</span><span>' + escapeHtml(item.category) + '</span></div>',
        '<h3><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h3>',
        '<p>' + escapeHtml(item.oneLine) + '</p>',
        '</div>',
        '</article>'
    ].join("");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}
