// Variables
const landingClips = shuffleArray([{"video": "okxgrowth", "image": "okxgrowth-poster"}, {"video": "nostaigia", "image": "nostaigia4"}, {"video": "hostilearchitecture", "image": "hostilearchitecture-conceptual3"}, {"video": "tairot", "image": "tairot"}]);
const landingVideos = document.querySelectorAll("#landing-background video");

let landingClipIndex = 0;
let landingActive = 0;

// Initialise
if (landingVideos.length === 2 && landingClips.length) initialiseLanding();
initialiseFilters();

// Functions
function initialiseLanding() {
    setLandingClip(landingVideos[0], landingClips[0]);
    landingVideos[0].classList.add("active");
    landingVideos[0].play().catch(() => {});

    if (landingClips.length > 1) setLandingClip(landingVideos[1], landingClips[1 % landingClips.length]);

    landingVideos.forEach(v => v.addEventListener("ended", advanceLanding));
}

function advanceLanding() {
    const next = 1 - landingActive;

    landingVideos[next].currentTime = 0;
    landingVideos[next].classList.add("active");
    landingVideos[next].play().catch(() => {});

    landingVideos[landingActive].classList.remove("active");
    landingVideos[landingActive].pause();
    landingVideos[landingActive].currentTime = 0;

    landingClipIndex = (landingClipIndex + 1) % landingClips.length;
    const incoming = (landingClipIndex + 1) % landingClips.length;
    setLandingClip(landingVideos[landingActive], landingClips[incoming]);

    landingActive = next;
}

function setLandingClip(video, clip) {
    if (video.dataset.clip === clip) return;
    video.dataset.clip = clip;
    video.poster = `resources/images/${clip.image}.jpg`;
    video.src = `resources/videos/${clip.video}.mp4`;
}

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

function shuffleArray(array) {
    for (var i = array.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}