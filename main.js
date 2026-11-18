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

  // Home page showcase: one set of points that morphs between the research areas.
  function startCloud() {
    var canvas = $('#cloud'), ctx = canvas.getContext('2d');
    var title = $('#cloud-title'), text = $('#cloud-text'), caption = $('#cloud-copy');
    var tabs = $$('[data-cloud]');
    var still = matchMedia('(prefers-reduced-motion: reduce)');
    var COUNT = 2800, HOLD = 5600, MORPH = 1500, FRAME = 1000 / 30, TAU = Math.PI * 2;
    var seed = 7, w = 0, h = 0, dark = false;
    var C = {
      pink: [236, 38, 124], orange: [249, 115, 22], violet: [124, 58, 237], blue: [37, 99, 235], cyan: [6, 182, 212],
      green: [16, 185, 129], amber: [245, 158, 11], slate: [100, 116, 139], magenta: [217, 70, 239]
    };
    function rnd() {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function between(a, b) { return a + (b - a) * rnd(); }
    function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function ramp(list, t) {
      var p = Math.min(.999, Math.max(0, t)) * (list.length - 1), i = Math.floor(p);
      return mix(list[i], list[i + 1], p - i);
    }
    function onSphere() {
      var y = between(-1, 1), a = between(0, TAU), r = Math.sqrt(1 - y * y);
      return [r * Math.cos(a), y, r * Math.sin(a)];
    }
    function onSegments(list, n, out, paint) {
      var lens = list.map(function (g) { return Math.hypot(g[3] - g[0], g[4] - g[1], g[5] - g[2]); });
      var total = lens.reduce(function (s, l) { return s + l; }, 0);
      for (var i = 0; i < n; i++) {
        var pick = rnd() * total, k = 0;
        while (k < list.length - 1 && pick > lens[k]) pick -= lens[k++];
        var g = list[k], t = rnd(), x = g[0] + (g[3] - g[0]) * t, y = g[1] + (g[4] - g[1]) * t, z = g[2] + (g[5] - g[2]) * t;
        out.push([x, y, z, paint(x, y, z)]);
      }
      return out;
    }
    function rect(x0, y0, x1, y1, z) {
      return [[x0, y0, z, x1, y0, z], [x1, y0, z, x1, y1, z], [x1, y1, z, x0, y1, z], [x0, y1, z, x0, y0, z]];
    }
    function brain() {
      var out = [], guard = 0, n = COUNT * .86;
      function region(x, y) {
        if (x > .34) return C.pink;
        if (x < -.46) return C.blue;
        if (y < -.04) return C.orange;
        return C.violet;
      }
      while (out.length < n && guard++ < 120000) {
        var d = onSphere(), x = d[0], y = d[1], z = d[2];
        var fold = Math.sin(9 * x + 2.4 * Math.sin(6 * y)) * Math.cos(9 * y + 2.4 * Math.sin(6 * z)) + .55 * Math.sin(10 * z + 3 * x);
        if (fold < -.12) continue;
        var r = 1 + .05 * fold;
        if (y > -.25) r *= 1 - .2 * Math.exp(-(z * z) / .012);
        var py = y * r * .74;
        if (py < -.32) py = -.32 + (py + .32) * .55;
        out.push([x * r * 1.02 + .04 * y, py + .08, z * r * .8, region(x, y)]);
      }
      while (out.length < COUNT * .97) {
        var c = onSphere(), s = 1 + .05 * Math.sin(c[1] * 34);
        out.push([c[0] * s * .3 - .64, c[1] * s * .2 - .46, c[2] * s * .42, C.green]);
      }
      while (out.length < COUNT) {
        var t = rnd(), a = between(0, TAU);
        out.push([-.2 - t * .12 + .07 * Math.cos(a), -.42 - t * .46, .07 * Math.sin(a), C.cyan]);
      }
      return out;
    }
    function page() {
      var z = .14, out = [], body = [], table = [], i;
      function solid(c) { return function () { return c; }; }
      for (i = 0; i < 5; i++) body.push([-.54, .5 - i * .085, z, i === 4 ? .04 : .54, .5 - i * .085, z]);
      for (i = 0; i < 3; i++) body.push([-.54, -.66 - i * .085, z, .54, -.66 - i * .085, z]);
      for (i = 0; i < 4; i++) table.push([.04, -.1 - i * .133, z, .54, -.1 - i * .133, z]);
      for (i = 0; i < 4; i++) table.push([.04 + i * .1667, -.1, z, .04 + i * .1667, -.5, z]);
      onSegments([[-.54, .78, z, .28, .78, z], [-.54, .71, z, .28, .71, z]], COUNT * .08, out, solid(C.pink));
      onSegments(rect(-.6, .65, .34, .84, z), COUNT * .04, out, solid(C.pink));
      onSegments(body, COUNT * .25, out, solid(C.blue));
      onSegments(rect(-.6, .13, .6, .57, z).concat(rect(-.6, -.88, .6, -.6, z)), COUNT * .07, out, solid(C.cyan));
      onSegments(table, COUNT * .15, out, solid(C.green));
      onSegments(rect(-.02, -.56, .6, -.04, z), COUNT * .04, out, solid(C.green));
      onSegments(rect(-.6, -.56, -.08, -.04, z), COUNT * .04, out, solid(C.amber));
      onSegments(rect(-.72, -.97, .72, .97, z), COUNT * .08, out, solid(C.slate));
      onSegments(rect(-.78, -.92, .66, 1.02, -.06).concat(rect(-.84, -.87, .6, 1.07, -.26)), COUNT * .08, out, solid(C.violet));
      while (out.length < COUNT) out.push([between(-.54, -.14), between(-.5, -.1), z, C.amber]);
      return out;
    }
    function network() {
      var sizes = [3, 5, 5, 3], nodes = [], links = [], out = [], colors = [C.cyan, C.violet, C.magenta, C.orange];
      function paint(x) { return ramp(colors, (x + 1.05) / 2.1); }
      sizes.forEach(function (n, l) {
        nodes[l] = [];
        for (var i = 0; i < n; i++) {
          var a = (i / n) * TAU + l;
          nodes[l].push([-1.02 + l * .68, .72 * Math.cos(a) * (n > 3 ? 1 : .7), .5 * Math.sin(a)]);
        }
      });
      nodes.forEach(function (layer, l) {
        layer.forEach(function (n) {
          for (var i = 0; i < 46; i++) {
            var d = onSphere(), r = .095 * Math.cbrt(rnd());
            out.push([n[0] + d[0] * r, n[1] + d[1] * r, n[2] + d[2] * r, paint(n[0])]);
          }
          if (nodes[l + 1]) nodes[l + 1].forEach(function (m) { links.push(n.concat(m)); });
        });
      });
      return onSegments(links, COUNT - out.length, out, paint);
    }
    function box3d() {
      var X = .92, Y = .68, Z = .68, v = [], e = [], out = [], i, j;
      for (i = 0; i < 8; i++) v.push([i & 1 ? X : -X, i & 2 ? Y : -Y, i & 4 ? Z : -Z]);
      for (i = 0; i < 8; i++) for (j = 0; j < 3; j++) if (!(i & (1 << j))) e.push(v[i].concat(v[i | (1 << j)]));
      onSegments(e, COUNT * .3, out, function () { return C.amber; });
      while (out.length < COUNT) {
        var a = between(0, TAU), b = between(0, TAU), r = .46 + .17 * Math.cos(b);
        var x = r * Math.cos(a), y = .17 * Math.sin(b), z = r * Math.sin(a);
        out.push([x, y * .8 + z * .55, z * .8 - y * .55, ramp([C.green, C.cyan, C.blue], (a / TAU + Math.sin(b) * .12 + 1) % 1)]);
      }
      return out;
    }
    var shapes = [
      { pts: brain(), axis: function (p) { return (p[0] + 1) / 2; } },
      { pts: page(), axis: function (p) { return (1 - p[1]) / 2; } },
      { pts: network(), axis: function (p) { return (p[0] + 1.1) / 2.2; } },
      { pts: box3d(), axis: function (p) { return (p[1] + 1) / 2; } }
    ];
    shapes.forEach(function (s, i) {
      s.title = tabs[i].dataset.title;
      s.text = tabs[i].dataset.text;
      while (s.pts.length > COUNT) s.pts.pop();
      s.pts.forEach(function (p) { p[4] = s.axis(p); });
      // Shuffle so points travel across the shape while morphing.
      for (var k = s.pts.length - 1; k > 0; k--) {
        var r = Math.floor(rnd() * (k + 1)), t = s.pts[k];
        s.pts[k] = s.pts[r]; s.pts[r] = t;
      }
    });
    var delay = new Float32Array(COUNT).map(function () { return rnd() * .3; });
    var clock = 0, from = 0, to = null, since = 0, prev = null, lastDraw = 0;

    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function setCopy(i) {
      var s = shapes[i];
      tabs.forEach(function (b, k) {
        b.setAttribute('aria-pressed', String(k === i));
        if (k !== i) b.firstChild.style.transform = 'scaleX(0)';
      });
      if (title.textContent === s.title) return;
      title.textContent = s.title;
      text.textContent = s.text;
      if (!still.matches) { caption.classList.remove('fresh'); void caption.offsetWidth; caption.classList.add('fresh'); }
    }
    function go(i) {
      if (to !== null) from = to;
      if (still.matches) { from = i; to = null; } else if (i !== from) { to = i; since = clock; } else { to = null; since = clock; }
      setCopy(i);
      draw();
    }
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function draw() {
      if (!w) return;
      var calm = still.matches, t = calm ? 0 : clock;
      var raw = to === null ? 0 : Math.min(1, (clock - since) / MORPH);
      var A = shapes[from].pts, B = shapes[to === null ? from : to].pts;
      var yaw = .48 * Math.sin(t / 4300) + .16, pitch = .16 + .05 * Math.sin(t / 5300);
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var scale = Math.min(w / 2.55, h / 2.5), sweep = t / 3400;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (var i = 0; i < COUNT; i++) {
        var a = A[i], b = B[i];
        var e = raw ? ease(Math.min(1, Math.max(0, (raw - delay[i]) / .7))) : 0;
        var lift = 1 + .18 * Math.sin(e * Math.PI);
        var x = (a[0] + (b[0] - a[0]) * e) * lift, y = (a[1] + (b[1] - a[1]) * e) * lift, z = (a[2] + (b[2] - a[2]) * e) * lift;
        var x1 = x * cy + z * sy, z1 = z * cy - x * sy, y1 = y * cp - z1 * sp, z2 = z1 * cp + y * sp;
        var p = 3.4 / (3.4 - z2), near = Math.min(1, Math.max(0, (z2 + 1) / 2));
        var c = e ? mix(a[3], b[3], e) : a[3];
        var phase = a[4] + (b[4] - a[4]) * e;
        var wave = calm ? 0 : Math.pow(Math.max(0, Math.cos(TAU * (phase * .75 - sweep))), 12);
        var size = (1 + near * .9 + wave * 1.3) * p;
        var sx = w / 2 + x1 * scale * p, sy2 = h / 2 - y1 * scale * p;
        ctx.fillStyle = 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
        if (wave > .25) {
          ctx.globalAlpha = (dark ? .16 : .08) * wave;
          ctx.fillRect(sx - size * 1.7, sy2 - size * 1.7, size * 3.4, size * 3.4);
        }
        ctx.globalAlpha = Math.min(1, (dark ? .3 : .38) + near * .55 + wave * .4);
        ctx.fillRect(sx - size / 2, sy2 - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    function tick(now) {
      requestAnimationFrame(tick);
      if (prev === null) prev = now;
      var dt = Math.min(100, now - prev);
      prev = now;
      if (document.hidden || still.matches || current !== 'about') return;
      clock += dt;
      if (to !== null && clock - since >= MORPH) { from = to; to = null; since = clock; }
      if (to === null && clock - since >= HOLD) go((from + 1) % shapes.length);
      var active = to === null ? from : to, done = to === null ? (clock - since) / HOLD : 0;
      tabs[active].firstChild.style.transform = 'scaleX(' + Math.min(1, done) + ')';
      if (clock - lastDraw < FRAME) return;
      lastDraw = clock;
      draw();
    }
    function readTheme() { dark = root.classList.contains('dark'); draw(); }
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    new MutationObserver(readTheme).observe(root, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(resize).observe(canvas);
    still.addEventListener('change', function () { go(from); });
    dark = root.classList.contains('dark');
    setCopy(0);
    if (still.matches) tabs[0].firstChild.style.transform = 'scaleX(1)';
    requestAnimationFrame(tick);
  }

  window.addEventListener('hashchange', function () { route(false); });
  route(true);
  startCloud();
})();
