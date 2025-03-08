// Variables
const logo = $("#logo");
const appearance = $("#appearance");
const nav = $("#nav");
const menu = $("#menu");
const close = $("#close");
const body = $('body');

const menuItems = [logo, nav, menu, close];
const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches;
var userPreference = sessionStorage.getItem("wilsonchangjy-preference");

// Functions
menu.load("resources/icons/menu.svg");
close.load("resources/icons/close.svg");
if (window.matchMedia("(max-width: 767px)").matches) initialiseMobile(); else initialiseDesktop();

function initialiseMobile() {
    nav.hide();
    close.hide();
    appearance.hide();

    menu.click(() => {
        toggleHeader([nav, close], [logo, menu]);
        $("#header .grid").css("justify-content", "end");
        $("#header .grid").css("gap", "24px");
    });
    close.click(() => { 
        toggleHeader([logo, menu], [nav, close]);
        $("#header .grid").css("justify-content", "space-between");
        $("#header .grid").css("gap", "12px");
    });
}

function initialiseDesktop() {
    menu.hide();
    close.hide();

    if (systemPreference) appearance.load("resources/icons/appearance.svg"); else appearance.load("resources/icons/appearance-alt.svg");
    if (userPreference != null && userPreference != systemPreference) displayAppearance();

    appearance.click(toggleAppearance);
}

function toggleHeader(fadeItems, hideItems) {
    fadeItems.forEach((element) => element.fadeIn(250));
    hideItems.forEach((element) => element.hide());
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