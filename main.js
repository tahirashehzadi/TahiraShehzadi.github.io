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

  // Home page point cloud: one set of points that morphs between shapes from the research areas.
  function startCloud() {
    var canvas = $('#cloud'), ctx = canvas.getContext('2d');
    var still = matchMedia('(prefers-reduced-motion: reduce)');
    var COUNT = 1700, HOLD = 5200, MORPH = 1500, FRAME = 1000 / 30;
    var seed = 7, w = 0, h = 0, color = '#000', last = 0;
    function rnd() {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function between(a, b) { return a + (b - a) * rnd(); }
    function onSphere() {
      var y = between(-1, 1), a = between(0, Math.PI * 2), r = Math.sqrt(1 - y * y);
      return [r * Math.cos(a), y, r * Math.sin(a)];
    }
    function onSegments(list, n, out) {
      var total = list.reduce(function (s, g) { return s + Math.hypot(g[3] - g[0], g[4] - g[1], g[5] - g[2]); }, 0);
      for (var i = 0; i < n; i++) {
        var pick = rnd() * total, k = 0, g = list[0], len;
        for (; k < list.length; k++) {
          g = list[k]; len = Math.hypot(g[3] - g[0], g[4] - g[1], g[5] - g[2]);
          if (pick <= len) break;
          pick -= len;
        }
        var t = rnd();
        out.push([g[0] + (g[3] - g[0]) * t, g[1] + (g[4] - g[1]) * t, g[2] + (g[5] - g[2]) * t]);
      }
      return out;
    }
    function brain() {
      var out = [], guard = 0;
      while (out.length < COUNT * .86 && guard++ < 90000) {
        var d = onSphere(), x = d[0], y = d[1], z = d[2];
        var fold = Math.sin(9 * x + 2.4 * Math.sin(6 * y)) * Math.cos(9 * y + 2.4 * Math.sin(6 * z)) + .55 * Math.sin(10 * z + 3 * x);
        if (fold < -.12) continue;
        var r = 1 + .05 * fold;
        if (y > -.25) r *= 1 - .2 * Math.exp(-(z * z) / .012);
        var py = y * r * .74;
        if (py < -.32) py = -.32 + (py + .32) * .55;
        out.push([x * r * 1.02 + .04 * y, py + .08, z * r * .8]);
      }
      while (out.length < COUNT * .97) {
        var c = onSphere(), s = 1 + .05 * Math.sin(c[1] * 34);
        out.push([c[0] * s * .3 - .64, c[1] * s * .2 - .46, c[2] * s * .42]);
      }
      while (out.length < COUNT) {
        var t = rnd(), a = between(0, 6.28);
        out.push([-.2 - t * .12 + .07 * Math.cos(a), -.42 - t * .46, .07 * Math.sin(a)]);
      }
      return out;
    }
    function rect(x0, y0, x1, y1, z) {
      return [[x0, y0, z, x1, y0, z], [x1, y0, z, x1, y1, z], [x1, y1, z, x0, y1, z], [x0, y1, z, x0, y0, z]];
    }
    function documentPage() {
      var z = .14, lines = [], i;
      lines.push([-.56, .78, z, .3, .78, z], [-.56, .72, z, .3, .72, z]);
      for (i = 0; i < 5; i++) lines.push([-.56, .54 - i * .09, z, i === 4 ? .02 : .56, .54 - i * .09, z]);
      for (i = 0; i < 4; i++) lines.push([.02, -.08 - i * .14, z, .56, -.08 - i * .14, z]);
      for (i = 0; i < 4; i++) lines.push([.02 + i * .18, -.08, z, .02 + i * .18, -.5, z]);
      for (i = 0; i < 3; i++) lines.push([-.56, -.66 - i * .09, z, .56, -.66 - i * .09, z]);
      var out = onSegments(lines, Math.round(COUNT * .52), []);
      onSegments(rect(-.7, -.95, .7, .95, z), Math.round(COUNT * .16), out);
      onSegments(rect(-.76, -.9, .64, 1, -.05).concat(rect(-.82, -.85, .58, 1.05, -.24)), Math.round(COUNT * .16), out);
      while (out.length < COUNT) out.push([between(-.56, -.08), between(-.5, -.08), z]);
      return out;
    }
    function network() {
      var layers = [3, 5, 5, 3], nodes = [], out = [];
      layers.forEach(function (n, l) {
        nodes[l] = [];
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2 + l;
          nodes[l].push([-1.02 + l * .68, .72 * Math.cos(a) * (n > 3 ? 1 : .7), .5 * Math.sin(a)]);
        }
      });
      var links = [];
      nodes.forEach(function (layer, l) {
        layer.forEach(function (n) {
          for (var i = 0; i < 26; i++) {
            var d = onSphere(), r = .085 * Math.cbrt(rnd());
            out.push([n[0] + d[0] * r, n[1] + d[1] * r, n[2] + d[2] * r]);
          }
          if (nodes[l + 1]) nodes[l + 1].forEach(function (m) { links.push(n.concat(m)); });
        });
      });
      return onSegments(links, COUNT - out.length, out);
    }
    function box3d() {
      var X = .92, Y = .68, Z = .68, v = [], e = [], out = [], i, j;
      for (i = 0; i < 8; i++) v.push([i & 1 ? X : -X, i & 2 ? Y : -Y, i & 4 ? Z : -Z]);
      for (i = 0; i < 8; i++) for (j = 0; j < 3; j++) if (!(i & (1 << j))) e.push(v[i].concat(v[i | (1 << j)]));
      onSegments(e, Math.round(COUNT * .34), out);
      while (out.length < COUNT) {
        var a = between(0, 6.28), b = between(0, 6.28), r = .46 + .17 * Math.cos(b);
        var x = r * Math.cos(a), y = .17 * Math.sin(b), z = r * Math.sin(a);
        out.push([x, y * .8 + z * .55, z * .8 - y * .55]);
      }
      return out;
    }
    var shapes = [
      { name: 'Medical imaging', pts: brain() },
      { name: 'Document intelligence', pts: documentPage() },
      { name: 'Neural networks', pts: network() },
      { name: '3D perception', pts: box3d() }
    ];
    var delay = shapes[0].pts.map(function () { return rnd() * .3; });
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function readTheme() { color = getComputedStyle(root).getPropertyValue('--accent').trim(); }
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(last);
    }
    function draw(ms) {
      if (!w) return;
      if (still.matches) ms = 0;
      var span = HOLD + MORPH, step = Math.floor(ms / span), local = ms - step * span;
      var from = shapes[step % shapes.length], to = shapes[(step + 1) % shapes.length];
      var raw = Math.max(0, (local - HOLD) / MORPH);
      var yaw = .5 * Math.sin(ms / 4200) + .18, pitch = .16 + .05 * Math.sin(ms / 5300);
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var scale = Math.min(w / 2.6, h / 2.6);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (var i = 0; i < COUNT; i++) {
        var a = from.pts[i], b = to.pts[i];
        var e = raw ? ease(Math.min(1, Math.max(0, (raw - delay[i]) / .7))) : 0;
        var lift = 1 + .16 * Math.sin(e * Math.PI);
        var x = (a[0] + (b[0] - a[0]) * e) * lift, y = (a[1] + (b[1] - a[1]) * e) * lift, z = (a[2] + (b[2] - a[2]) * e) * lift;
        var x1 = x * cy + z * sy, z1 = z * cy - x * sy;
        var y1 = y * cp - z1 * sp, z2 = z1 * cp + y * sp;
        var p = 3.4 / (3.4 - z2), near = Math.min(1, Math.max(0, (z2 + 1) / 2));
        var size = (.8 + near * .9) * p;
        ctx.globalAlpha = .22 + near * .73;
        ctx.fillRect(w / 2 + x1 * scale * p - size / 2, h / 2 - y1 * scale * p - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }
    var begin = null;
    function tick(now) {
      requestAnimationFrame(tick);
      if (document.hidden || still.matches || current !== 'about') { begin = null; return; }
      if (begin === null) begin = now - last;
      if (now - begin - last < FRAME) return;
      last = now - begin;
      draw(last);
    }
    readTheme();
    new MutationObserver(function () { readTheme(); draw(last); }).observe(root, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(resize).observe(canvas);
    still.addEventListener('change', function () { draw(last); });
    requestAnimationFrame(tick);
  }

  window.addEventListener('hashchange', function () { route(false); });
  route(true);
  startCloud();
})();
