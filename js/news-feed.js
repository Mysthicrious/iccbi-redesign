/* assets/js/news-feed.js
   Replaces the static cards in #newsGrid with the latest Facebook posts from data/news.json.
   If the file is missing, empty, or fails to load, the static cards in home.html stay as they are. */
(function () {
    'use strict';

    var LIMIT = 3; // how many cards to show
    var grid = document.getElementById('newsGrid');
    if (!grid) return;

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;   // textContent only — post text is never parsed as HTML
        return node;
    }

    function isFacebookUrl(url) {
        return /^https:\/\/(www\.|m\.)?facebook\.com\//i.test(url || '');
    }

    function buildCard(item, fallbackUrl) {
        var card = el('a', 'news-card');
        card.href = isFacebookUrl(item.url) ? item.url : fallbackUrl;
        card.target = '_blank';
        card.rel = 'noopener';
        card.setAttribute('data-reveal', 'fade-up');

        var photo = el('div', 'news-photo');
        var fallback = el('span', 'np-fallback', item.category || 'ICCBI');
        fallback.setAttribute('aria-hidden', 'true');
        photo.appendChild(fallback);

        if (item.image) {
            var img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title || '';
            img.loading = 'lazy';
            img.onerror = function () { img.style.display = 'none'; };
            photo.appendChild(img);
        }

        var body = el('div', 'nc-body');
        var meta = el('div', 'nc-meta');
        meta.appendChild(el('span', 'nc-cat', item.category || 'Campus Life'));
        meta.appendChild(el('span', 'dot', '·'));
        meta.appendChild(el('span', 'nc-date', item.dateLabel || ''));

        body.appendChild(meta);
        body.appendChild(el('h4', '', item.title));
        if (item.excerpt) body.appendChild(el('p', '', item.excerpt));
        body.appendChild(el('span', 'read', 'Read on Facebook'));

        card.appendChild(photo);
        card.appendChild(body);
        return card;
    }

    fetch('data/news.json', { cache: 'no-cache' })
        .then(function (res) {
            if (!res.ok) throw new Error('news.json not available');
            return res.json();
        })
        .then(function (data) {
            var items = ((data && data.items) || []).filter(function (i) { return i && i.title; }).slice(0, LIMIT);
            if (!items.length) return;                       // keep static cards

            var fallbackUrl = (data && data.pageUrl) || 'https://www.facebook.com/ICCBalayanIncOfficial';
            grid.textContent = '';
            var cards = items.map(function (item) { return buildCard(item, fallbackUrl); });
            cards.forEach(function (c) { grid.appendChild(c); });

            // Same fade-up as the rest of the page (the page's own observer only knew the old cards).
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    cards.forEach(function (c) { c.classList.add('revealed'); });
                });
            });
        })
        .catch(function () { /* keep static cards */ });
})();
