// Variables

// Initialise
initialiseTOC();

// Functions
function initialiseTOC() {
    const tableOfContents = $("#table-of-contents");
    if (!tableOfContents.length) return;

    const sections = $("#content > [data-toc]");
    if (!sections.length) return;

    sections.each(function() {
        const id = this.id;
        const label = $(this).data("toc");
        tableOfContents.append(`<li><a class="contrast" href="#${id}">${label}</a></li>`);
    });

    const headerVar = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
    const isMobile = () => window.matchMedia("(max-width: 1023px)").matches;
    const tocOffset = () => isMobile() ? tableOfContents.outerHeight() : 0;

    tableOfContents.on("click", "a", function(e) {
        e.preventDefault();
        const id = $(this).attr("href").slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - headerVar() - tocOffset() - 24;
        window.scrollTo({ top, behavior: "smooth" });
    });

    function updateActive() {
        const threshold = headerVar() + tocOffset() + 48;
        let activeId = sections[0].id;
        sections.each(function() {
            if (this.getBoundingClientRect().top - threshold <= 0) activeId = this.id;
        });

        tableOfContents.find("a").removeClass("active");
        const activeLink = tableOfContents.find(`a[href="#${activeId}"]`);
        activeLink.addClass("active");

        if (isMobile()) scrollTocIntoView(activeLink[0]);
    }

    function scrollTocIntoView(linkEl) {
        if (!linkEl) return;
        const scroller = tableOfContents[0];
        const item = linkEl.parentElement;
        const itemStart = item.offsetLeft;
        const itemEnd = itemStart + item.offsetWidth;
        const visibleStart = scroller.scrollLeft;
        const visibleEnd = visibleStart + scroller.clientWidth;
        
        if (itemStart < visibleStart || itemEnd > visibleEnd) {
            const target = itemStart + item.offsetWidth / 2 - scroller.clientWidth / 2;
            scroller.scrollTo({ left: target, behavior: "smooth" });
        }
    }

    $(window).on("scroll resize", updateActive);
    updateActive();
}