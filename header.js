// Variables
const logo = $("#logo");
const appearance = $("#appearance");
const nav = $("#nav");
const menu = $("#menu");
const close = $("#close");
const body = $('body');

const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches;
var userPreference = sessionStorage.getItem("wilsonchangjy-preference");

// Functions 
if (window.matchMedia("(max-width: 1023px)").matches) initialiseMobile(); else initialiseDesktop();

const currentPath = window.location.pathname;

if (currentPath.endsWith("about.html")) nav.find("a[href='about.html']").parent().addClass("disabled");
else if (currentPath.endsWith("index.html") || currentPath.endsWith("/")) nav.find("a[href='index.html']").parent().addClass("disabled");

document.documentElement.style.setProperty('--header-height', $('#header').innerHeight() + 'px');

function initialiseMobile() {
    close.hide();
    appearance.hide();

    menu.click(openMenu);
    close.click(closeMenu);

    nav.find("a").click(closeMenu);
}

function initialiseDesktop() {
    menu.hide();
    close.hide();

    if (systemPreference) appearance.load("resources/icons/appearance.svg"); else appearance.load("resources/icons/appearance-alt.svg");
    if (userPreference != null && userPreference != systemPreference) displayAppearance();

    appearance.click(toggleAppearance);
}

function openMenu() {
    menu.hide();
    close.fadeIn(150);
    body.addClass("menu-open");
}

function closeMenu() {
    close.hide();
    menu.fadeIn(150);
    body.removeClass("menu-open");
}

function displayAppearance() {
    let currentPreference;
    if (parseInt(userPreference)) currentPreference = true; else currentPreference = false;
    if (currentPreference) body.addClass("light-mode"), body.removeClass("dark-mode"); else body.addClass("dark-mode"), body.removeClass("light-mode");

    const icon = currentPreference ? "resources/icons/appearance.svg" : "resources/icons/appearance-alt.svg";
    appearance.load(icon);
}

function toggleAppearance() {
    if (userPreference == null) userPreference = systemPreference ? 0 : 1;
    else userPreference = 1 - userPreference;

    sessionStorage.setItem("wilsonchangjy-preference", userPreference ? 1 : 0);

    displayAppearance();
}
