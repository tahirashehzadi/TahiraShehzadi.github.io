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

  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
