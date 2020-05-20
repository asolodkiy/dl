videojs.registerPlugin('dl', function() {
    var player = this,
        overlay = document.createElement('p');
    var options = {"overlayText": "overlayText"};
    overlay.className = 'vjs-overlay';
    overlay.innerHTML = "Becoming a plugin developer";
    player.el().appendChild(overlay);
});