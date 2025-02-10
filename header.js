// Variables
const logo = $("#logo");
const appearance = $("#appearance");
const nav = $("#nav");
const menu = $("#menu");
const close = $("#close");

const menuItems = [logo, nav, menu, close];

// Functions
appearance.load("resources/icons/appearance.svg");
menu.load("resources/icons/menu.svg");
close.load("resources/icons/close.svg");

if (window.matchMedia("(max-width: 767px)").matches) initialiseMobile(); else initialiseDesktop();

function initialiseMobile() {
    nav.hide();
    close.hide();

    menu.click(() => {
        toggleDisplay([nav, close], [logo, menu]);
        $("#header .grid").css("justify-content", "end");
        $("#header .grid").css("gap", "24px");
    });
    close.click(() => { 
        toggleDisplay([logo, menu], [nav, close]);
        $("#header .grid").css("justify-content", "space-between");
        $("#header .grid").css("gap", "12px");
    });
}

function toggleDisplay(fadeItems, hideItems) {
    fadeItems.forEach((element) => element.fadeIn(500));
    hideItems.forEach((element) => element.hide());
}

function initialiseDesktop() {
    menu.hide();
    close.hide();
}