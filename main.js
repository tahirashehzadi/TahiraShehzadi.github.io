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
    try { localStorage.setItem('site-theme', dark ? 'dark' : 'light'); } catch (e) {}
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
    var title = $('#cloud-title'), sub = $('#cloud-sub'), text = $('#cloud-text'), caption = $('#cloud-copy');
    var tabs = $$('[data-cloud]');
    var still = matchMedia('(prefers-reduced-motion: reduce)');
    var COUNT = 2800, HOLD = 5600, HOLD_MEDICAL = 3000, MORPH = 1300, FRAME = 1000 / 30, TAU = Math.PI * 2;
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
    function ellipsoid(c, r, n, out, paint) {
      for (var i = 0; i < n; i++) {
        var d = onSphere(), x = c[0] + d[0] * r[0], y = c[1] + d[1] * r[1], z = c[2] + d[2] * r[2];
        out.push([x, y, z, paint(x, y, z)]);
      }
    }
    function solid(c) { return function () { return c; }; }
    function chest() {
      var out = [], spine = [], n = COUNT * .36, i;
      function rib() {
        var k = Math.floor(rnd() * 10), side = rnd() < .5 ? -1 : 1, a = between(-Math.PI / 2, Math.PI / 2);
        var R = .46 + .4 * Math.sin((k + 1.6) / 11 * Math.PI), y = .78 - k * .16 + .07 * Math.sin(a) - .15 * Math.cos(a);
        var x = side * R * Math.cos(a), z = .52 * R * Math.sin(a);
        out.push([x, y, z, ramp([C.cyan, C.blue], (.85 - y) / 1.8)]);
      }
      for (i = 0; i < n; i++) rib();
      for (i = 0; i < 12; i++) spine.push([-.035, .84 - i * .14, -.42, .035, .84 - i * .14, -.42]);
      onSegments(spine, COUNT * .07, out, solid(C.slate));
      ellipsoid([-.36, .02, 0], [.28, .62, .27], COUNT * .14, out, solid(C.violet));
      ellipsoid([.36, .02, 0], [.28, .62, .27], COUNT * .14, out, solid(C.violet));
      ellipsoid([-.09, -.22, .12], [.2, .24, .16], COUNT * .08, out, solid(C.pink));
      ellipsoid([.42, .22, .2], [.085, .085, .085], COUNT * .06, out, solid(C.orange));
      onSegments(rect(.26, .06, .58, .38, .3), COUNT * .05, out, solid(C.amber));
      while (out.length < COUNT) rib();
      return out;
    }
    function polyp() {
      var out = [], i;
      ellipsoid([.36, -.3, .16], [.2, .2, .2], COUNT * .17, out, solid(C.green));
      onSegments([[.46, -.38, .12, .55, -.46, .08]], COUNT * .02, out, solid(C.green));
      onSegments(rect(.1, -.58, .64, -.04, .4), COUNT * .06, out, solid(C.cyan));
      while (out.length < COUNT) {
        var j = Math.floor(rnd() * 14), d = j / 13, a = between(0, TAU);
        var r = .84 * (1 - .76 * Math.pow(d, .7)) * (1 + .05 * Math.sin(5 * a + j)) + between(-.008, .008);
        out.push([r * Math.cos(a) + .1 * Math.sin(d * 3), r * Math.sin(a) + .08 * d, .6 - 1.6 * d, ramp([C.orange, C.pink, C.violet], d)]);
      }
      return out;
    }
    function skin() {
      var out = [], A = .55, ca = Math.cos(A), sa = Math.sin(A), i;
      function top(x, z) { return .28 + .025 * Math.sin(9 * x) * Math.cos(7 * z); }
      function edge(x, z) {
        var t = Math.atan2(z - .03, x - .08);
        return .31 + .07 * Math.sin(3 * t) + .05 * Math.sin(7 * t);
      }
      for (i = 0; i < COUNT * .24; i++) {
        var u = between(-.95, .95), band = rnd(), y = .28 - band * .9;
        var wave = Math.round(band * 8) / 8, yy = .28 - wave * .9 + .018 * Math.sin(u * 11 + wave * 9);
        out.push([u, yy, .6, ramp([C.pink, C.orange, C.amber], wave)]);
      }
      onSegments([[-.95, .28, .6, -.95, -.62, .6], [.95, .28, .6, .95, -.62, .6], [-.95, -.62, .6, .95, -.62, .6], [.95, .28, .6, .95, .28, -.6], [-.95, .28, .6, -.95, .28, -.6], [-.95, .28, -.6, .95, .28, -.6]], COUNT * .06, out, solid(C.slate));
      onSegments([[-.36, .31, -.42, .52, .31, -.42], [.52, .31, -.42, .52, .31, .48], [.52, .31, .48, -.36, .31, .48], [-.36, .31, .48, -.36, .31, -.42]], COUNT * .06, out, solid(C.cyan));
      var guard = 0;
      while (out.length < COUNT * .56 && guard++ < 90000) {
        var x = between(-.26, .42), z = between(-.36, .42), rho = Math.hypot(x - .08, z - .03) / edge(x, z);
        if (rho < 1) out.push([x, top(x, z) + .02, z, ramp([C.violet, C.magenta, C.pink], rho)]);
      }
      while (out.length < COUNT) {
        var sx = between(-.95, .95), sz = between(-.6, .6);
        if (Math.hypot(sx - .08, sz - .03) / edge(sx, sz) < 1.04) continue;
        out.push([sx, top(sx, sz), sz, rnd() < .5 ? C.amber : C.orange]);
      }
      return out.map(function (p) { return [p[0], p[1] * ca - p[2] * sa + .12, p[2] * ca + p[1] * sa, p[3]]; });
    }
    function page() {
      var z = .14, out = [], body = [], table = [], i;
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
    function saliency() {
      var out = [], guard = 0, heatColors = [C.blue, C.cyan, C.green, C.amber, C.orange, C.pink];
      var peaks = [[-.34, .16, .3, 1], [.36, -.14, .22, .86], [.08, .46, .16, .5], [-.58, -.42, .15, .42]];
      function heat(x, y) {
        return Math.min(1, peaks.reduce(function (s, p) {
          return s + p[3] * Math.exp(-((x - p[0]) * (x - p[0]) + (y - p[1]) * (y - p[1])) / (2 * p[2] * p[2]));
        }, 0));
      }
      onSegments(rect(-1, -.76, 1, .76, -.12), COUNT * .08, out, function () { return C.slate; });
      while (out.length < COUNT && guard++ < 120000) {
        var x = between(-.97, .97), y = between(-.73, .73), v = heat(x, y);
        if (rnd() > .24 + v * .76) continue;
        out.push([x, y, v * .62 - .12, ramp(heatColors, v)]);
      }
      return out;
    }
    function report() {
      var z = .12, out = [], lines = [], i;
      function ink(x, y) { return ramp([C.violet, C.blue, C.cyan], (.62 - y) / 1.3); }
      lines.push([-.2, .58, z, .5, .58, z], [-.2, .49, z, .34, .49, z]);
      for (i = 0; i < 5; i++) lines.push([-.5, .26 - i * .115, z, i === 4 ? .08 : .5, .26 - i * .115, z]);
      for (i = 0; i < 3; i++) lines.push([-.5, -.46 - i * .115, z, -.02, -.46 - i * .115, z]);
      onSegments(lines, COUNT * .36, out, ink);
      onSegments(rect(-.66, -.92, .66, .84, z).concat(rect(-.72, -.97, .6, .79, -.1)), COUNT * .17, out, solid(C.slate));
      onSegments(rect(-.22, .78, .22, .96, z), COUNT * .05, out, solid(C.green));
      onSegments([[.86, .86, z, .86, .38, z], [.62, .62, z, 1.1, .62, z], [.76, .72, z, .96, .52, z], [.96, .72, z, .76, .52, z]], COUNT * .07, out, solid(C.amber));
      for (i = 0; i < COUNT * .08; i++) {
        if (rnd() < .5) out.push([between(-.5, -.3), between(.51, .57), z, C.pink]);
        else out.push([between(-.43, -.37), between(.44, .64), z, C.pink]);
      }
      var bars = [[.1, .12], [.22, .26], [.34, .18], [.46, .34]];
      while (out.length < COUNT) {
        var b = bars[Math.floor(rnd() * bars.length)];
        out.push([b[0] + between(-.04, .04), -.72 + rnd() * b[1], z, C.green]);
      }
      return out;
    }
    var shapes = [
      { tab: 0, sub: 'Chest imaging', pts: chest(), axis: function (p) { return (1 - p[1]) / 2; } },
      { tab: 0, sub: 'Polyp detection', pts: polyp(), axis: function (p) { return (.6 - p[2]) / 1.6; } },
      { tab: 0, sub: 'Skin lesions', pts: skin(), axis: function (p) { return (p[0] + 1) / 2; } },
      { tab: 1, pts: page(), axis: function (p) { return (1 - p[1]) / 2; } },
      { tab: 2, pts: network(), axis: function (p) { return (p[0] + 1.1) / 2.2; } },
      { tab: 3, pts: saliency(), axis: function (p) { return (p[0] + 1) / 2; } },
      { tab: 4, pts: report(), axis: function (p) { return (1 - p[1]) / 2; } }
    ];
    var first = [], size = [];
    shapes.forEach(function (s, i) {
      s.title = tabs[s.tab].dataset.title;
      s.text = tabs[s.tab].dataset.text;
      s.hold = s.sub ? HOLD_MEDICAL : HOLD;
      if (first[s.tab] === undefined) first[s.tab] = i;
      size[s.tab] = (size[s.tab] || 0) + 1;
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
        b.setAttribute('aria-pressed', String(k === s.tab));
        if (k !== s.tab) b.firstChild.style.transform = 'scaleX(0)';
      });
      sub.textContent = s.sub || '';
      sub.hidden = !s.sub;
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
    // Home page background: two small research shapes drifting slowly in the side margins.
    var bgCanvas = $('#bg-cloud'), bgCtx = bgCanvas.getContext('2d');
    var BG_STEP = 2, BG_CYCLE = 12000, BG_MORPH = 1800, BG_FRAME = 50;
    var vw = 0, vh = 0, bgClock = 0, lastBg = 0, margin = null;
    var drifters = [[0, .62], [1, .24]].map(function (slot, i) {
      return { side: slot[0], y: slot[1], start: (i * 2 + 1) % shapes.length, offset: i * 1900, phase: i * 1.7, depth: 1 + (i % 3) * .35 };
    });
    function resizeBg() {
      var dpr = Math.min(devicePixelRatio || 1, 1.5);
      vw = innerWidth; vh = innerHeight;
      bgCanvas.width = Math.round(vw * dpr);
      bgCanvas.height = Math.round(vh * dpr);
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBg();
    }
    function drawBg() {
      if (!vw) return;
      var calm = still.matches, t = calm ? 0 : bgClock * .55;
      margin = Math.max(0, (vw - 1120) / 2);
      bgCtx.clearRect(0, 0, vw, vh);
      if (current !== 'about' || margin < 110) return;
      var list = drifters, R = Math.max(44, Math.min(70, margin * .36)), strength = 1;
      var inset = Math.max(R * .55, margin / 2);
      bgCtx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      list.forEach(function (d) {
        var clockAt = t + d.offset, k = Math.floor(clockAt / BG_CYCLE), local = clockAt - k * BG_CYCLE;
        var A = shapes[(d.start + k) % shapes.length].pts, B = shapes[(d.start + k + 1) % shapes.length].pts;
        var e = ease(Math.max(0, (local - (BG_CYCLE - BG_MORPH)) / BG_MORPH));
        var yaw = .62 * Math.sin(t / 4600 + d.phase), pitch = .22 * Math.sin(t / 6100 + d.phase);
        var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        var span = vh + R * 3;
        var y0 = d.y * vh + 22 * Math.sin(t / 5200 + d.phase) - scrollY * .05 * d.depth;
        y0 = ((y0 + R * 1.5) % span + span) % span - R * 1.5;
        var x0 = (d.side ? vw - inset : inset) + 16 * Math.sin(t / 6700 + d.phase * 2);
        for (var i = 0; i < COUNT; i += BG_STEP) {
          var a = A[i], b = B[i];
          var x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e, z = a[2] + (b[2] - a[2]) * e;
          var x1 = x * cy + z * sy, z1 = z * cy - x * sy, y1 = y * cp - z1 * sp, z2 = z1 * cp + y * sp;
          var p = 3.4 / (3.4 - z2), near = Math.min(1, Math.max(0, (z2 + 1) / 2));
          var c = e ? mix(a[3], b[3], e) : a[3], size = (.8 + near * .6) * p;
          bgCtx.globalAlpha = strength * ((dark ? .42 : .55) + near * .45);
          bgCtx.fillStyle = 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
          bgCtx.fillRect(x0 + x1 * R * p - size / 2, y0 - y1 * R * p - size / 2, size, size);
        }
      });
      bgCtx.globalAlpha = 1;
      bgCtx.globalCompositeOperation = 'source-over';
    }
    function tick(now) {
      requestAnimationFrame(tick);
      if (prev === null) prev = now;
      var dt = Math.min(100, now - prev);
      prev = now;
      if (document.hidden || still.matches) return;
      bgClock += dt;
      if (bgClock - lastBg >= BG_FRAME) { lastBg = bgClock; drawBg(); }
      if (current !== 'about') return;
      clock += dt;
      if (to !== null && clock - since >= MORPH) { from = to; to = null; since = clock; }
      if (to === null && clock - since >= shapes[from].hold) go((from + 1) % shapes.length);
      var active = to === null ? from : to, s = shapes[active];
      var done = to === null ? Math.min(1, (clock - since) / s.hold) : 0;
      tabs[s.tab].firstChild.style.transform = 'scaleX(' + (active - first[s.tab] + done) / size[s.tab] + ')';
      if (clock - lastDraw < FRAME) return;
      lastDraw = clock;
      draw();
    }
    function readTheme() { dark = root.classList.contains('dark'); draw(); drawBg(); }
    tabs.forEach(function (b, i) { b.addEventListener('click', function () { go(first[i]); }); });
    new MutationObserver(readTheme).observe(root, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(resize).observe(canvas);
    still.addEventListener('change', function () { go(from); drawBg(); });
    dark = root.classList.contains('dark');
    window.addEventListener('resize', resizeBg);
    window.addEventListener('hashchange', drawBg);
    resizeBg();
    setCopy(0);
    if (still.matches) tabs[0].firstChild.style.transform = 'scaleX(1)';
    requestAnimationFrame(tick);
  }

  window.addEventListener('hashchange', function () { route(false); });
  route(true);
  startCloud();
})();
