(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var titles = { about: '', publications: 'Publications', projects: 'Projects', experience: 'Experience', education: 'Education', honors: 'Honors', contact: 'Contact' };
  var topic = 'all';
  var current = null;

  function applyFilter() {
    var q = $('#q').value.trim().toLowerCase();
    var shown = 0;
    $$('.pub').forEach(function (p) {
      var ok = (topic === 'all' || p.dataset.topic === topic) && (!q || p.textContent.toLowerCase().indexOf(q) > -1);
      p.hidden = !ok;
      p.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    $$('.pub-group').forEach(function (g) {
      g.style.display = $$('.pub', g).some(function (p) { return !p.hidden; }) ? '' : 'none';
    });
    $$('.filter').forEach(function (f) {
      if (f.dataset.filter === topic) f.setAttribute('aria-current', 'true'); else f.removeAttribute('aria-current');
    });
    $('#count').textContent = shown + (shown === 1 ? ' paper' : ' papers');
    $('#empty').hidden = shown > 0;
  }

  function route(first) {
    var hash = location.hash.slice(1);
    var name = hash;
    var nextTopic = 'all';
    if (hash.indexOf('publications-') === 0) {
      name = 'publications';
      nextTopic = hash.slice(13);
      if (!$('[data-group="' + nextTopic + '"]')) nextTopic = 'all';
    }
    if (!titles.hasOwnProperty(name)) name = 'about';
    var samePage = name === current;
    current = name;
    topic = nextTopic;
    $$('.page').forEach(function (p) { p.classList.toggle('on', p.id === name); });
    $$('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = titles[name] ? titles[name] + ' | Tahira Shehzadi' : 'Tahira Shehzadi';
    closeMenu();
    applyFilter();
    if (!samePage) {
      window.scrollTo(0, 0);
      if (!first) $('#h-' + name).focus({ preventScroll: true });
    }
  }

  function closeMenu() {
    $('#nav').classList.remove('open');
    $('#menu').setAttribute('aria-expanded', 'false');
  }

  function copy(text, button, done) {
    var old = button.textContent;
    function show(msg) {
      button.textContent = msg;
      setTimeout(function () { button.textContent = old; }, 1800);
    }
    try {
      navigator.clipboard.writeText(text).then(function () { show(done); }, function () { show('Copy unavailable'); });
    } catch (e) { show('Copy unavailable'); }
  }

  $('#menu').addEventListener('click', function () {
    var open = $('#nav').classList.toggle('open');
    this.setAttribute('aria-expanded', String(open));
  });
  $('#theme').addEventListener('click', function () {
    var dark = root.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  });
  $('#q').addEventListener('input', applyFilter);
  $$('[data-bib]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#bib-x').textContent = $('template', b.closest('.pub-body')).content.textContent;
      $('#bib').showModal();
    });
  });
  $('#bib-copy').addEventListener('click', function () { copy($('#bib-x').textContent, this, 'Copied'); });
  $('#copy-mail').addEventListener('click', function () { copy(this.dataset.mail, this, 'Copied'); });

  // The CV button is removed where the PDF is not hosted, so it never leads to an error page.
  var cv = $('[data-cv]');
  fetch(cv.getAttribute('href'), { method: 'HEAD' }).then(function (r) {
    if (!r.ok) cv.remove();
  }).catch(function () { cv.remove(); });

  // Home page background: waves spreading through a grid, like labels propagating to unlabeled points.
  function startField() {
    var canvas = $('#field');
    var ctx = canvas.getContext('2d');
    var still = matchMedia('(prefers-reduced-motion: reduce)');
    var GAP = 26, SPEED = 34, REACH = 560, BAND = 52, FRAME = 1000 / 30;
    var SEEDS = [[.74, .22, 0], [.95, .72, 1 / 3], [.58, .9, 2 / 3]];
    var w = 0, h = 0, dots = [], last = 0, color = '#000', base = .14;

    function smooth(a, b, x) {
      var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }
    function readTheme() {
      color = getComputedStyle(root).getPropertyValue('--accent').trim();
      base = root.classList.contains('dark') ? .2 : .14;
    }
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var wide = w > 760;
      var textEnd = $('.intro').getBoundingClientRect().right - r.left;
      dots = [];
      for (var y = GAP / 2; y < h; y += GAP) for (var x = GAP / 2; x < w; x += GAP) {
        // Keep the grid away from the text column.
        var keep = wide ? smooth(textEnd + 10, textEnd + 100, x) : 1 - smooth(120, 300, y);
        if (keep > .02) dots.push([x, y, keep]);
      }
      draw(last);
    }
    function draw(ms) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      var t = still.matches ? null : ms / 1000;
      dots.forEach(function (d) {
        var glow = 0;
        if (t !== null) SEEDS.forEach(function (s) {
          var r = (t * SPEED + s[2] * REACH) % REACH;
          var off = (Math.hypot(d[0] - s[0] * w, d[1] - s[1] * h) - r) / BAND;
          if (Math.abs(off) < 2.5) glow = Math.max(glow, Math.exp(-off * off) * (1 - r / REACH));
        });
        var size = 2 + glow * 1.6;
        ctx.globalAlpha = d[2] * (base + glow * .6);
        ctx.fillRect(d[0] - size / 2, d[1] - size / 2, size, size);
      });
      ctx.globalAlpha = 1;
    }
    function tick(ms) {
      requestAnimationFrame(tick);
      if (document.hidden || still.matches || current !== 'about' || ms - last < FRAME) return;
      last = ms;
      draw(ms);
    }
    readTheme();
    new MutationObserver(function () { readTheme(); draw(last); }).observe(root, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(resize).observe(canvas);
    still.addEventListener('change', function () { draw(last); });
    requestAnimationFrame(tick);
  }

  window.addEventListener('hashchange', function () { route(false); });
  route(true);
  startField();
})();
