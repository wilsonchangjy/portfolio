// Variables
const projectsArray = shuffleArray(["nostaigia", "tairot", "new-balance", "hostile-architecture"]);

// Initialise
pasteStickers();

// Functions
function pasteStickers() {
    const stickerSlots = shuffleArray($(".sticker")).splice(projectsArray.length);

    stickerSlots.forEach(slot => {
        slot.classList.remove("sticker");
        slot.classList.add("spacing");
        slot.previousElementSibling.classList.add("right-16");
    });

    $(".sticker").each(function(index) {
        const imageElement = $("<img />");
        imageElement.attr("src", `resources/images/${projectsArray[index].replace('-', '')}-sticker.png`);
        imageElement.css('transform', 'rotate(' + (Math.random() * (10 - (-10)) + (-10)) + 'deg)');
        $(this).append(imageElement);    
    });
}

function shuffleArray(array) {
    for (var i = array.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}