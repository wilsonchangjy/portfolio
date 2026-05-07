import { layoutNextLine, prepareWithSegments } from "https://esm.sh/@chenglou/pretext";

// Config
const TEXT = "Hello World, I’m Wilson C, a Product Designer, UX Engineer & occasional Creative Technologist based in Singapore";
const STICKER_PADDING_X = -36;
const STICKER_PADDING_Y = -36;
const VIEWPORT_BLEED = 24;
const ROTATION_RANGE = 10;
const LETTER_SPACING_EM = -0.02;

// Elements
const stage = document.getElementById("text-stage");
const probe = document.getElementById("wrap-probe");
const stickers = Array.from(document.querySelectorAll("#sticker-layer .sticker"));

// State
let topZ = 100;
let words = []; // [{ text, width }]
let spaceWidth = 0;
let lineHeight = 0;
let fontKey = "";
let letterSpacingPx = 0;
let pendingRelayout = false;

// === Pretext helpers ===
function carveTextLineSlots(base, blocked, minWidth) {
    let slots = [base];
    for (const interval of blocked) {
        const next = [];
        for (const slot of slots) {
            if (interval.right <= slot.left || interval.left >= slot.right) {
                next.push(slot);
                continue;
            }
            if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left });
            if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right });
        }
        slots = next;
    }
    return slots.filter(s => s.right - s.left >= minWidth);
}

function getFontShorthand() {
    const cs = getComputedStyle(probe);
    return `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function measureWord(text) {
    const p = prepareWithSegments(text, fontKey, { letterSpacing: letterSpacingPx });
    const line = layoutNextLine(p, { segmentIndex: 0, graphemeIndex: 0 }, 999999);
    return line !== null ? line.width : 0;
}

function rebuildPrepared() {
    const newKey = getFontShorthand();
    if (newKey === fontKey && words.length > 0) return;
    fontKey = newKey;
    const fontSize = parseFloat(getComputedStyle(probe).fontSize);
    letterSpacingPx = LETTER_SPACING_EM * fontSize;
    lineHeight = parseFloat(getComputedStyle(probe).lineHeight);

    const tokens = TEXT.split(/\s+/).filter(w => w.length > 0);
    words = tokens.map(text => ({ text, width: measureWord(text) }));
    // Effective inter-word gap: width contributed by inserting a space between two characters.
    spaceWidth = Math.max(0, measureWord("x x") - measureWord("xx"));
}

function getStageBox() {
    return stage.getBoundingClientRect();
}

function getObstacles() {
    const sb = getStageBox();
    return stickers.map(el => {
        const r = el.getBoundingClientRect();
        return {
            left: r.left - sb.left - STICKER_PADDING_X,
            right: r.right - sb.left + STICKER_PADDING_X,
            top: r.top - sb.top - STICKER_PADDING_Y,
            bottom: r.bottom - sb.top + STICKER_PADDING_Y,
        };
    });
}

// === Render loop ===
function relayout() {
    pendingRelayout = false;
    if (words.length === 0) return;

    const sb = getStageBox();
    const regionW = sb.width;
    const obstacles = getObstacles();

    const fragment = document.createDocumentFragment();
    let wordIndex = 0;
    let lineTop = 0;

    // Sanity bound: 200 bands is way more than any realistic layout would need.
    let bandsAttempted = 0;
    while (wordIndex < words.length && bandsAttempted++ < 200) {
        const bandTop = lineTop;
        const bandBottom = lineTop + lineHeight;
        const blocked = [];

        for (const obs of obstacles) {
            if (obs.bottom <= bandTop || obs.top >= bandBottom) continue;
            blocked.push({ left: obs.left, right: obs.right });
        }

        const slots = carveTextLineSlots({ left: 0, right: regionW }, blocked, 24);
        if (slots.length === 0) {
            lineTop += lineHeight;
            continue;
        }

        const orderedSlots = [...slots].sort((a, b) => a.left - b.left);
        for (const slot of orderedSlots) {
            if (wordIndex >= words.length) break;
            const slotWidth = slot.right - slot.left;
            // Skip slots that can't even fit the next word (prevents intra-word breaks).
            if (words[wordIndex].width > slotWidth) continue;

            const packed = [];
            let usedWidth = 0;
            while (wordIndex < words.length) {
                const word = words[wordIndex];
                const gap = packed.length > 0 ? spaceWidth : 0;
                if (usedWidth + gap + word.width > slotWidth) break;
                packed.push(word);
                usedWidth += gap + word.width;
                wordIndex++;
            }
            if (packed.length === 0) continue;

            const div = document.createElement("div");
            div.className = "line";
            div.style.width = `${Math.round(slotWidth)}px`;
            div.style.transform = `translate(${Math.round(slot.left)}px, ${Math.round(lineTop)}px)`;
            div.textContent = packed.map(w => w.text).join(" ");
            fragment.appendChild(div);
        }

        lineTop += lineHeight;
    }

    stage.replaceChildren(fragment);
    // Grow the stage (and therefore #landing) to fit the laid-out content,
    // so the page becomes scrollable when text overflows the viewport.
    stage.style.height = `${lineTop}px`;
}

function scheduleRelayout() {
    if (pendingRelayout) return;
    pendingRelayout = true;
    requestAnimationFrame(relayout);
}

// === Stickers ===
function applyTransform(el) {
    el.style.transform = `translate(${el._x}px, ${el._y}px) rotate(${el._rotation}deg)`;
}

function placeStickerInitial(el) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    el._x = Math.random() * (vw - w + 2 * VIEWPORT_BLEED) - VIEWPORT_BLEED;
    el._y = Math.random() * (vh - h + 2 * VIEWPORT_BLEED) - VIEWPORT_BLEED;
    el._rotation = (Math.random() * 2 - 1) * ROTATION_RANGE;
    applyTransform(el);
}

function clampSticker(el) {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    el._x = Math.max(-VIEWPORT_BLEED, Math.min(vw - r.width + VIEWPORT_BLEED, el._x));
    el._y = Math.max(-VIEWPORT_BLEED, Math.min(vh - r.height + VIEWPORT_BLEED, el._y));
    applyTransform(el);
}

function attachDrag(el) {
    let startX = 0, startY = 0, originX = 0, originY = 0;

    el.addEventListener("pointerdown", e => {
        e.preventDefault();
        topZ += 1;
        el.style.zIndex = topZ;
        el.classList.add("dragging");
        startX = e.clientX;
        startY = e.clientY;
        originX = el._x;
        originY = el._y;
        el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", e => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        el._x = originX + (e.clientX - startX);
        el._y = originY + (e.clientY - startY);
        applyTransform(el);
        scheduleRelayout();
    });

    function release(e) {
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        el.classList.remove("dragging");
        clampSticker(el);
        scheduleRelayout();
    }

    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
}

// === Init ===
async function init() {
    await document.fonts.ready;
    rebuildPrepared();

    await Promise.all(stickers.map(s =>
        s.complete && s.naturalWidth > 0
            ? Promise.resolve()
            : new Promise(res => {
                s.addEventListener("load", res, { once: true });
                s.addEventListener("error", res, { once: true });
            })
    ));

    stickers.forEach(s => {
        placeStickerInitial(s);
        s.style.zIndex = topZ;
        topZ += 1;
        attachDrag(s);
    });

    relayout();
}

window.addEventListener("resize", () => {
    rebuildPrepared();
    stickers.forEach(clampSticker);
    scheduleRelayout();
});

init();
