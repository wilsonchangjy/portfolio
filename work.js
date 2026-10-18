// Initialise
initialiseFilters();
initialiseWorkClips();

// Functions
function initialiseFilters() {
    const filters = document.getElementById("filters");
    if (!filters) return;

    const cards = document.querySelectorAll("#work .card");
    filters.addEventListener("click", function (e) {
        const selected = e.target.closest(".filter");
        if (!selected) return;

        const filter = selected.dataset.filter;
        filters.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
        selected.classList.add("active");

        cards.forEach(card => card.classList.toggle("hide", filter !== "all" && card.dataset.category !== filter));
    });
}

function initialiseWorkClips() {
    const cards = document.querySelectorAll("#work .card[data-video]");
    if (!cards.length) return;

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => playWorkClip(card));
            card.addEventListener("mouseleave", () => stopWorkClip(card));
        });
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const card = entry.target.closest(".card");
            if (entry.isIntersecting) playWorkClip(card); else stopWorkClip(card);
        });
    }, { rootMargin: "-40% 0px -40% 0px" }); // observation band = middle 20% of the viewport

    cards.forEach(card => observer.observe(card.querySelector(".thumbnail")));
}

function playWorkClip(card) {
    const video = card.querySelector("video");
    if (!video) return;
    if (!video.src) video.src = `resources/videos/${card.dataset.video}.mp4`;

    video.play().then(() => { if (!video.paused) video.classList.add("active"); }).catch(() => {});
}

function stopWorkClip(card) {
    const video = card.querySelector("video");
    if (!video) return;

    video.classList.remove("active");
    video.pause();
    video.currentTime = 0;
}
