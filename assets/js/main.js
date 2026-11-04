/* =====================================================
   ICCBI Redesign Concept — main.js
   Path: assets/js/main.js
   Loaded with: <script src="assets/js/main.js" defer></script>
   ===================================================== */
(function () {
    'use strict';

    /* ---------- Header height -> CSS variable (--header-h) ---------- */
    const siteHeader = document.querySelector('header.site');
    if (siteHeader) {
        function setHeaderBottom() {
            document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
        }
        setHeaderBottom();
        window.addEventListener('resize', setHeaderBottom);
    }

    /* ---------- Accreditation certificate lightbox ---------- */
    function parseCertTitle(title) {
        const emParts = title.split(/\s*—\s*/);
        const body = emParts[0]?.trim() || '';
        const rest = emParts.slice(1).join(' — ').trim();
        const periodMatch = rest.match(/\(([^)]+)\)\s*$/);
        const period = periodMatch ? periodMatch[1].trim() : '';
        const desc = rest.replace(/\s*\([^)]+\)\s*$/, '').trim();
        const commaParts = desc.split(/\s*,\s*/);
        const levelRegex = /Level\s+[IVXL]+[a-z]*/i;
        let program = '';
        let level = '';
        const levelPart = commaParts.find(p => levelRegex.test(p));
        if (levelPart) {
            level = levelRegex.exec(levelPart)[0];
            program = commaParts.find(p => !levelRegex.test(p)) || '';
        } else {
            program = commaParts[commaParts.length - 1] || '';
            if (/Formal Accredited/i.test(desc)) level = 'Level I';
            else if (/Certificate of Accreditation/i.test(desc)) level = 'Accredited';
            else level = 'Accredited';
        }
        return { body, program, period, level, fullDesc: desc };
    }

    const certLightbox = document.getElementById('certLightbox');
    const certImage = document.getElementById('certImage');
    const certEmpty = document.getElementById('certEmpty');
    const certTitle = document.getElementById('certTitle');
    const certDesc = document.getElementById('certDesc');
    const certBody = document.getElementById('certBody');
    const certProgram = document.getElementById('certProgram');
    const certLevel = document.getElementById('certLevel');
    const certPeriod = document.getElementById('certPeriod');
    let certLastFocus = null;

    function openCert(card) {
        const src = card.getAttribute('data-cert');
        if (!src) return;
        certLastFocus = document.activeElement;
        const title = card.getAttribute('data-cert-title') || 'Accreditation certificate';
        const parsed = parseCertTitle(title);
        certImage.style.display = '';
        certEmpty.style.display = 'none';
        certImage.onload = function () { certEmpty.style.display = 'none'; };
        certImage.onerror = function () { certImage.style.display = 'none'; certEmpty.style.display = 'flex'; };
        certImage.src = src;
        certImage.alt = title;
        const article = /^[aeiou]/i.test(parsed.level) ? 'an' : 'a';
        certTitle.textContent = parsed.fullDesc || title;
        certDesc.innerHTML = '<strong>' + parsed.body + '</strong> awarded ICCBI\'s <strong>' + (parsed.program || 'program') + '</strong> ' + article + ' <strong>' + parsed.level + '</strong> accreditation — recognizing the school\'s commitment to academic standards, institutional quality, and Catholic formation.';
        certBody.textContent = parsed.body || '—';
        certProgram.textContent = parsed.program || '—';
        certLevel.textContent = parsed.level || 'Accredited';
        certPeriod.textContent = parsed.period || '—';
        certLightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        const closeBtn = certLightbox.querySelector('.cert-close');
        if (closeBtn) closeBtn.focus();
    }

    function closeCert() {
        certLightbox.hidden = true;
        certImage.src = '';
        document.body.style.overflow = '';
        if (certLastFocus) certLastFocus.focus();
    }

    document.querySelectorAll('.accred-card[data-cert]').forEach(function (card) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'View certificate: ' + (card.getAttribute('data-cert-title') || ''));
        card.addEventListener('click', function () { openCert(card); });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCert(card); }
        });
    });

    certLightbox.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeCert); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !certLightbox.hidden) closeCert(); });

    /* ---------- Odometer numbers in the hero ---------- */
    document.querySelectorAll('[data-odometer]').forEach(function (el) {
        var text = el.getAttribute('data-odometer');
        el.textContent = '';
        for (var i = 0; i < text.length; i++) {
            var wrap = document.createElement('span');
            wrap.className = 'od-char';
            var inner = document.createElement('span');
            inner.textContent = text[i];
            inner.style.transitionDelay = (0.25 + i * 0.15) + 's';
            wrap.appendChild(inner);
            el.appendChild(wrap);
        }
    });

    /* ---------- Scroll reveal ---------- */
    var revealElements = document.querySelectorAll('[data-reveal]');
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (entry.target.classList.contains('num-grid-hero')) entry.target.classList.add('roll');
            } else {
                entry.target.classList.remove('revealed');
                if (entry.target.classList.contains('num-grid-hero')) entry.target.classList.remove('roll');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(function (el) { revealObserver.observe(el); });

    /* ---------- About video (play on view, sound toggle) ---------- */
    var aboutVideo = document.getElementById('aboutVideo');
    var videoSound = document.getElementById('videoSound');
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (aboutVideo) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !prefersReduced) {
                    var p = aboutVideo.play(); if (p) p.catch(function () {});
                } else { aboutVideo.pause(); }
            });
        }, { threshold: 0.35 });
        videoObserver.observe(aboutVideo);
    }
    if (videoSound && aboutVideo) {
        videoSound.addEventListener('click', function () {
            aboutVideo.muted = !aboutVideo.muted;
            videoSound.textContent = aboutVideo.muted ? 'SOUND: OFF' : 'SOUND: ON';
            videoSound.setAttribute('aria-label', aboutVideo.muted ? 'Turn sound on' : 'Turn sound off');
        });
    }

    /* ---------- Hymn video (play on view, sound toggle) ---------- */
    var hymnVideo = document.getElementById('hymnVideo');
    var hymnSound = document.getElementById('hymnSound');
    if (hymnVideo) {
        var hymnObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !prefersReduced) {
                    var p = hymnVideo.play(); if (p) p.catch(function () {});
                } else { hymnVideo.pause(); }
            });
        }, { threshold: 0.35 });
        hymnObserver.observe(hymnVideo);
    }
    if (hymnSound && hymnVideo) {
        hymnSound.addEventListener('click', function () {
            hymnVideo.muted = !hymnVideo.muted;
            hymnSound.textContent = hymnVideo.muted ? 'SOUND: OFF' : 'SOUND: ON';
            hymnSound.setAttribute('aria-label', hymnVideo.muted ? 'Turn sound on' : 'Turn sound off');
        });
    }

    /* ---------- Mobile navigation ---------- */
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');
    var navOverlay = document.getElementById('navOverlay');
    var subMenu = document.getElementById('subMenu');
    var mobileSubmenuToggle = document.getElementById('mobileSubmenuToggle');
    var aboutLink = document.getElementById('aboutLink');

    function lockBody() { document.body.classList.add('menu-open'); }
    function unlockBody() { document.body.classList.remove('menu-open'); }

    function closeMobileMenu() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        if (navOverlay) navOverlay.classList.remove('open');
        unlockBody();
        subMenu.classList.remove('open');
        if (mobileSubmenuToggle) {
            mobileSubmenuToggle.classList.remove('open');
            mobileSubmenuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    function openMobileMenu() {
        navLinks.classList.add('open');
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        if (navOverlay) navOverlay.classList.add('open');
        lockBody();
        navLinks.scrollTop = 0;
    }

    if (hamburger) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (navLinks.classList.contains('open')) { closeMobileMenu(); } else { openMobileMenu(); }
        });
    }

    if (mobileSubmenuToggle) {
        mobileSubmenuToggle.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            var isOpen = subMenu.classList.toggle('open');
            mobileSubmenuToggle.classList.toggle('open');
            mobileSubmenuToggle.setAttribute('aria-expanded', isOpen);
            if (isOpen) {
                setTimeout(function () {
                    var lastItem = subMenu.querySelector('.grid a:last-child');
                    if (lastItem) lastItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }, 100);
            }
        });
    }

    if (aboutLink) {
        aboutLink.addEventListener('click', function (e) {
            if (window.innerWidth <= 992) { e.preventDefault(); if (mobileSubmenuToggle) mobileSubmenuToggle.click(); }
        });
    }

    if (navOverlay) navOverlay.addEventListener('click', closeMobileMenu);

    navLinks.querySelectorAll('a:not(.mobile-submenu-toggle)').forEach(function (a) {
        a.addEventListener('click', function () {
            if (window.innerWidth <= 992) { if (a.id === 'aboutLink') return; closeMobileMenu(); }
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) { closeMobileMenu(); if (hamburger) hamburger.focus(); }
    });

    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 992) {
            if (subMenu.classList.contains('open') && !subMenu.contains(e.target) && !aboutLink.contains(e.target) && !mobileSubmenuToggle.contains(e.target)) {
                subMenu.classList.remove('open');
                if (mobileSubmenuToggle) { mobileSubmenuToggle.classList.remove('open'); mobileSubmenuToggle.setAttribute('aria-expanded', 'false'); }
            }
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 992) {
            if (navLinks.classList.contains('open')) closeMobileMenu();
            subMenu.classList.remove('open');
            if (mobileSubmenuToggle) { mobileSubmenuToggle.classList.remove('open'); mobileSubmenuToggle.setAttribute('aria-expanded', 'false'); }
            unlockBody();
        }
    });

    /* ---------- Site guide (? button) ---------- */
    var guideToggle = document.getElementById('guideToggle');
    var guidePanel = document.getElementById('guidePanel');
    var guideDismiss = document.getElementById('guideDismiss');

    function openGuide() {
        if (guidePanel) guidePanel.classList.add('open');
        if (guideToggle) { guideToggle.classList.add('open'); guideToggle.textContent = '✕'; guideToggle.setAttribute('aria-expanded', 'true'); }
    }
    function closeGuide() {
        if (guidePanel) guidePanel.classList.remove('open');
        if (guideToggle) { guideToggle.classList.remove('open'); guideToggle.textContent = '?'; guideToggle.setAttribute('aria-expanded', 'false'); }
    }

    if (guideToggle) guideToggle.addEventListener('click', function () { guidePanel.classList.contains('open') ? closeGuide() : openGuide(); });
    if (guideDismiss) guideDismiss.addEventListener('click', closeGuide);

    document.addEventListener('click', function (e) {
        if (guidePanel && guidePanel.classList.contains('open') && !guidePanel.contains(e.target) && !guideToggle.contains(e.target)) closeGuide();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && guidePanel && guidePanel.classList.contains('open')) closeGuide(); });

    window.addEventListener('beforeunload', function () { unlockBody(); });

    /* ---------- Block pinch-zoom / double-tap zoom on touch devices ---------- */
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });

    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

})();
