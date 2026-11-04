(function () {
  'use strict';

  var PAGE_URL = 'https://www.facebook.com/ICCBalayanIncOfficial';
  var HEIGHT   = 700;   // Facebook allows 70 to 1000
  var MIN_W    = 280;   // Facebook minimum is 180
  var MAX_W    = 500;   // Facebook maximum is 500

  var frame = document.getElementById('fbFrame');
  if (!frame) return;

  var lastWidth = 0;
  var timer = null;

  function build() {
    var w = Math.floor(frame.clientWidth) || MAX_W;
    w = Math.max(MIN_W, Math.min(MAX_W, w));

    // Skip rebuilding for tiny size changes (avoids reload flicker)
    if (Math.abs(w - lastWidth) < 20 && frame.querySelector('iframe')) return;
    lastWidth = w;

    var src = 'https://www.facebook.com/plugins/page.php'
      + '?href=' + encodeURIComponent(PAGE_URL)
      + '&tabs=timeline'
      + '&width=' + w
      + '&height=' + HEIGHT
      + '&small_header=true'
      + '&adapt_container_width=true'
      + '&hide_cover=true'
      + '&show_facepile=false';

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = w;
    iframe.height = HEIGHT;
    iframe.title = 'ICCBI Facebook page timeline';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow',
      'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');

    frame.innerHTML = '';
    frame.appendChild(iframe);
  }

  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(build, 300);
  }

  build();
  window.addEventListener('resize', onResize);
})();
