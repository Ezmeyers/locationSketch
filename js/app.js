// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs

setup();
function setup()
{
    new Foundation.OffCanvas($("#offCanvas"));

    $(document).foundation();

}

function sideNav() {
    if ($(window).width() < 769) {
        $('.off-canvas-wrap').removeClass('move-right');
        $('.left-off-canvas-toggle').show();
    } else {
        $('.off-canvas-wrap').addClass('move-right');
        $('.left-off-canvas-toggle').hide();
    }
}

$(window).resize(function() {
    sideNav();
});


