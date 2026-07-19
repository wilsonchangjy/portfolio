// Project registry — image filenames are bound to a project by prefix.
// To add a tile: drop the image in resources/images/ and append its filename
// to IMAGES below. Its destination/title are derived from the
// matching prefix here. To omit an image, simply leave it out of IMAGES.
const PROJECTS = [
    { prefix: "okxgrowth",          url: "okx-growth.html",           title: "OKX Growth Suite"},
    { prefix: "nostaigia",          url: "nostaigia.html",            title: "Liminal Landscapes: nostAIgia"},
    { prefix: "tairot",             url: "tairot.html",               title: "tAIrot"},
    { prefix: "hostilearchitecture", url: "hostile-architecture.html", title: "The Average Singaporean's Guide to Hostile Architecture"},
];

// Work images only (stickers, placeholder, preview and profile omitted).
const IMAGES = [
    "okxgrowth.jpg", "okxgrowth2.jpg", "okxgrowth3.jpg", "okxgrowth-campaigns-poster.jpg", "okxgrowth-poster.jpg",
    "nostaigia.jpg", "nostaigia2.jpg", "nostaigia3.jpg", "nostaigia4.jpg",
    "tairot.jpg", "tairot2.jpg", "tairot3.png",
    "hostilearchitecture.jpg", "hostilearchitecture2.jpg", "hostilearchitecture3.jpg", "hostilearchitecture4.jpg", "hostilearchitecture5.jpg",
    "hostilearchitecture-conceptual.jpg", "hostilearchitecture-conceptual2.jpg", "hostilearchitecture-conceptual3.jpg", "hostilearchitecture-conceptual4.jpg", "hostilearchitecture-research.jpg",
];

// Tunables
const AMBIENT_SPEED = 0.5;   // constant drift magnitude (px/frame) — motion never fully stops
const FRICTION = 0.95;       // a fling decays by this each frame, easing back down to AMBIENT_SPEED
const MAX_VELOCITY = 60;     // px/frame cap on release velocity
const DRAG_THRESHOLD = 6;    // px of movement before a press counts as a drag (vs click)
const STALE_DRAG_MS = 100;   // if the pointer paused this long before release, don't fling

const stage = document.getElementById("gallery-stage");
const plane = document.getElementById("gallery-plane");

let offsetX = 0, offsetY = 0;   // unbounded accumulated pan
let velX = 0, velY = 0;         // current velocity
let periodX = 0, periodY = 0;   // tiling period (block size + gap) for wrapping
let dragging = false, dragHappened = false, captured = false;
let startX = 0, startY = 0, originX = 0, originY = 0;
let lastX = 0, lastY = 0, lastTime = 0;
let shuffledOrder = null; // fixed image order for the session (shuffled once)
let rafId = null;

// Hardcoded aspect ratios (width / height) so the gallery lays out instantly —
// no waiting for images to decode. Add an entry when adding a new image; any
// filename missing here falls back to 1.5.
const ASPECTS = {
    "okxgrowth.jpg": 1.5, "okxgrowth2.jpg": 1.333, "okxgrowth3.jpg": 1.778,
    "okxgrowth-campaigns-poster.jpg": 1.778, "okxgrowth-poster.jpg": 1.778,
    "nostaigia.jpg": 1.6, "nostaigia2.jpg": 1.333, "nostaigia3.jpg": 1.776, "nostaigia4.jpg": 1.776,
    "tairot.jpg": 1.429, "tairot2.jpg": 1.521, "tairot3.png": 2.495,
    "hostilearchitecture.jpg": 1.503, "hostilearchitecture2.jpg": 1.503, "hostilearchitecture3.jpg": 1.503,
    "hostilearchitecture4.jpg": 1.503, "hostilearchitecture5.jpg": 1.504,
    "hostilearchitecture-conceptual.jpg": 1.5, "hostilearchitecture-conceptual2.jpg": 1.5,
    "hostilearchitecture-conceptual3.jpg": 1.5, "hostilearchitecture-conceptual4.jpg": 1.5,
    "hostilearchitecture-research.jpg": 1.778,
};

// Functions
function projectFor(filename) {
    return PROJECTS.find(p => filename.startsWith(p.prefix));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Build a justified-rows block (Flickr/Google-Photos style): images keep their
// natural aspect ratio, grouped into rows that are each scaled to fill the block
// width exactly. Every block is a clean rectangle of width --block-w, so the
// infinite tiling stays seamless.
function buildBlock() {
    const W = parseFloat(getComputedStyle(plane).getPropertyValue("--block-w")) || 1600;
    const H0 = parseFloat(getComputedStyle(plane).getPropertyValue("--base-h")) || 240;
    const G = parseFloat(getComputedStyle(plane).getPropertyValue("--gap")) || 96;
    const N = shuffledOrder.length;
    const aspectOf = f => ASPECTS[f] || 1.5;

    // Group images into rows; a row closes once its natural width (at H0) fills W.
    const rows = [];
    let row = [], aspectSum = 0;
    for (let i = 0; i < N; i++) {
        row.push(shuffledOrder[i]);
        aspectSum += aspectOf(shuffledOrder[i]);
        if (H0 * aspectSum + (row.length - 1) * G >= W) { rows.push(row); row = []; aspectSum = 0; }
    }
    if (row.length) { // pad the final row by cycling images so it also fills W
        for (let c = 0; H0 * aspectSum + (row.length - 1) * G < W; c++) {
            row.push(shuffledOrder[c % N]);
            aspectSum += aspectOf(shuffledOrder[c % N]);
        }
        rows.push(row);
    }

    const block = document.createElement("div");
    block.className = "gallery-block";
    block.style.width = `${W}px`;

    rows.forEach(items => {
        const asum = items.reduce((s, f) => s + aspectOf(f), 0);
        const h = (W - (items.length - 1) * G) / asum; // justified row height

        const rowEl = document.createElement("div");
        rowEl.className = "gallery-row";
        items.forEach(f => {
            const project = projectFor(f);
            if (!project) return;

            const tile = document.createElement("a");
            tile.className = "gallery-tile";
            tile.href = project.url;
            tile.draggable = false;
            tile.style.width = `${h * aspectOf(f)}px`; // image renders at height h
            tile.innerHTML =
                `<img src="resources/images/${f}" alt="${project.title}" style="aspect-ratio: ${aspectOf(f)}" draggable="false" decoding="async" onload="this.classList.add('loaded')">` +
                `<p class="caption primary">${project.title}</p>`;
            rowEl.appendChild(tile);
        });
        block.appendChild(rowEl);
    });
    return block;
}

// (Re)build a field of identical blocks large enough to cover the stage plus one
// block of overflow, so wrapping the plane by one period is seamless.
function layout() {
    plane.replaceChildren();

    const first = buildBlock(); // rebuilt each layout so it picks up the current breakpoint's vars
    plane.appendChild(first);

    const cs = getComputedStyle(first);
    periodX = first.offsetWidth + (parseFloat(cs.columnGap) || 0);
    periodY = first.offsetHeight + (parseFloat(cs.rowGap) || 0);

    const copiesX = Math.ceil(stage.clientWidth / periodX) + 1;
    const copiesY = Math.ceil(stage.clientHeight / periodY) + 1;

    for (let i = 0; i < copiesX; i++) {
        for (let j = 0; j < copiesY; j++) {
            const block = (i === 0 && j === 0) ? first : first.cloneNode(true);
            block.style.left = `${i * periodX}px`;
            block.style.top = `${j * periodY}px`;
            if (!(i === 0 && j === 0)) plane.appendChild(block);
        }
    }
}

function applyWrap() {
    let wx = offsetX % periodX; if (wx > 0) wx -= periodX; // keep in (-periodX, 0]
    let wy = offsetY % periodY; if (wy > 0) wy -= periodY;
    plane.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
}

function tick() {
    if (!dragging) {
        let speed = Math.hypot(velX, velY);
        if (speed < 0.0001) {
            const a = Math.random() * Math.PI * 2; // motion died — pick a fresh ambient heading
            velX = Math.cos(a) * AMBIENT_SPEED;
            velY = Math.sin(a) * AMBIENT_SPEED;
        } else {
            const target = Math.max(AMBIENT_SPEED, speed * FRICTION); // decay a fling, but floor at ambient
            const scale = target / speed;
            velX *= scale;
            velY *= scale;
        }
        offsetX += velX;
        offsetY += velY;
    }
    applyWrap();
    rafId = requestAnimationFrame(tick);
}

function onPointerDown(e) {
    dragging = true;
    dragHappened = false;
    captured = false;
    startX = e.clientX;
    startY = e.clientY;
    originX = offsetX;
    originY = offsetY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = performance.now();
    // velocity intentionally left intact: a plain click resumes the prior drift,
    // a drag overwrites it via pointermove below.
    // NOTE: pointer is NOT captured here — capturing on a tap would retarget the
    // synthesized click to the stage and break tile navigation. Capture begins
    // only once a real drag starts (see onPointerMove).

    stage.classList.add("dragging");
}

function onPointerMove(e) {
    if (!dragging) return;

    offsetX = originX + (e.clientX - startX);
    offsetY = originY + (e.clientY - startY);

    const now = performance.now();
    const dt = now - lastTime || 16;
    velX = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (e.clientX - lastX) / dt * 16));
    velY = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (e.clientY - lastY) / dt * 16));
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;

    if (!dragHappened && (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD)) {
        dragHappened = true;
        try { stage.setPointerCapture(e.pointerId); captured = true; } catch (_) {} // capture only once dragging
    }
    applyWrap();
}

function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    if (captured && stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    captured = false;

    if (!dragHappened) return; // a click: leave drift untouched (it resumes), let the link fire

    const stale = performance.now() - lastTime > STALE_DRAG_MS;
    if (stale || Math.hypot(velX, velY) < AMBIENT_SPEED) {
        // paused or slow release — drift in the overall drag direction at ambient speed
        const dx = lastX - startX, dy = lastY - startY;
        const dmag = Math.hypot(dx, dy) || 1;
        velX = dx / dmag * AMBIENT_SPEED;
        velY = dy / dmag * AMBIENT_SPEED;
    }
    // otherwise keep the fling velocity; tick eases it back down to ambient in the same direction
}

// Suppress tile navigation if the press was a drag, not a click.
function onClickCapture(e) {
    if (dragHappened) {
        e.preventDefault();
        e.stopPropagation();
    }
}

function init() {
    shuffledOrder = shuffle([...IMAGES]);
    layout();

    offsetX = Math.random() * periodX; // randomise the initial window
    offsetY = Math.random() * periodY;

    const a = Math.random() * Math.PI * 2; // randomise the initial drift direction
    velX = Math.cos(a) * AMBIENT_SPEED;
    velY = Math.sin(a) * AMBIENT_SPEED;

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener("click", onClickCapture, true);
    stage.addEventListener("dragstart", e => e.preventDefault()); // kill native image/link drag ghost

    window.addEventListener("load", layout);
    window.addEventListener("resize", layout);

    rafId = requestAnimationFrame(tick);
}

init();
