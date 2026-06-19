(() => {
    const ready = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    };

    ready(() => {
        const toggle = document.querySelector(".nav-toggle");
        const links = document.querySelector(".nav-links");
        if (toggle && links) {
            toggle.addEventListener("click", () => {
                const opened = links.classList.toggle("open");
                toggle.setAttribute("aria-expanded", opened ? "true" : "false");
            });
        }

        document.querySelectorAll("[data-site-search]").forEach((form) => {
            form.addEventListener("submit", (event) => {
                const input = form.querySelector("input[name='q']");
                if (!input) {
                    return;
                }
                const value = input.value.trim();
                if (!value) {
                    event.preventDefault();
                    window.location.href = form.getAttribute("action") || "./search.html";
                }
            });
        });

        document.querySelectorAll("[data-hero]").forEach((hero) => {
            const slides = Array.from(hero.querySelectorAll(".hero-slide"));
            const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
            const prev = hero.querySelector("[data-hero-prev]");
            const next = hero.querySelector("[data-hero-next]");
            let current = 0;
            let timer = null;

            const activate = (index) => {
                current = (index + slides.length) % slides.length;
                slides.forEach((slide, slideIndex) => {
                    slide.classList.toggle("active", slideIndex === current);
                });
                dots.forEach((dot, dotIndex) => {
                    dot.classList.toggle("active", dotIndex === current);
                });
            };

            const start = () => {
                stop();
                timer = window.setInterval(() => activate(current + 1), 5200);
            };

            const stop = () => {
                if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }
            };

            dots.forEach((dot) => {
                dot.addEventListener("click", () => {
                    activate(Number(dot.getAttribute("data-hero-dot")) || 0);
                    start();
                });
            });
            if (prev) {
                prev.addEventListener("click", () => {
                    activate(current - 1);
                    start();
                });
            }
            if (next) {
                next.addEventListener("click", () => {
                    activate(current + 1);
                    start();
                });
            }
            hero.addEventListener("mouseenter", stop);
            hero.addEventListener("mouseleave", start);
            if (slides.length > 1) {
                start();
            }
        });

        const params = new URLSearchParams(window.location.search);
        const query = params.get("q") || "";
        document.querySelectorAll("[data-filter-panel]").forEach((panel) => {
            const input = panel.querySelector("[data-filter-input]");
            const type = panel.querySelector("[data-filter-type]");
            const year = panel.querySelector("[data-filter-year]");
            const scope = panel.parentElement || document;
            const cards = Array.from(scope.querySelectorAll(".filter-card"));

            if (input && query) {
                input.value = query;
            }

            const apply = () => {
                const words = (input?.value || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
                const typeValue = (type?.value || "").toLowerCase();
                const yearValue = (year?.value || "").toLowerCase();

                cards.forEach((card) => {
                    const text = [
                        card.dataset.title,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year,
                        card.dataset.genre,
                        card.dataset.tags
                    ].join(" ").toLowerCase();
                    const typeText = (card.dataset.type || "").toLowerCase();
                    const yearText = (card.dataset.year || "").toLowerCase();
                    const wordMatched = words.every((word) => text.includes(word));
                    const typeMatched = !typeValue || typeText.includes(typeValue);
                    const yearMatched = !yearValue || yearText.includes(yearValue);
                    card.hidden = !(wordMatched && typeMatched && yearMatched);
                });
            };

            [input, type, year].forEach((element) => {
                if (element) {
                    element.addEventListener("input", apply);
                    element.addEventListener("change", apply);
                }
            });
            apply();
        });

        document.querySelectorAll(".video-shell").forEach((shell) => {
            const video = shell.querySelector("video");
            const overlay = shell.querySelector(".play-overlay");
            const stream = shell.getAttribute("data-stream") || video?.getAttribute("data-stream") || overlay?.getAttribute("data-stream") || "";
            let initialized = false;
            let hlsInstance = null;

            const attach = () => {
                if (!video || !stream || initialized) {
                    return Promise.resolve();
                }
                initialized = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                    return Promise.resolve();
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 60
                    });
                    hlsInstance.loadSource(stream);
                    hlsInstance.attachMedia(video);
                    return new Promise((resolve) => {
                        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
                        hlsInstance.on(window.Hls.Events.ERROR, () => resolve());
                    });
                }
                video.src = stream;
                return Promise.resolve();
            };

            const play = () => {
                attach().then(() => {
                    shell.classList.add("playing");
                    const promise = video.play();
                    if (promise && typeof promise.catch === "function") {
                        promise.catch(() => {
                            shell.classList.remove("playing");
                        });
                    }
                });
            };

            if (overlay) {
                overlay.addEventListener("click", play);
            }
            if (video) {
                video.addEventListener("click", () => {
                    if (video.paused) {
                        play();
                    }
                });
                video.addEventListener("play", () => shell.classList.add("playing"));
                video.addEventListener("pause", () => {
                    if (!video.ended) {
                        shell.classList.remove("playing");
                    }
                });
                video.addEventListener("ended", () => shell.classList.remove("playing"));
            }
            window.addEventListener("pagehide", () => {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    });
})();
