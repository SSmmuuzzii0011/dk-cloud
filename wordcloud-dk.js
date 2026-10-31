/* Облако тегов курса "Документоведение и документооборот". Аналог WordArt, JSON с GitHub. v1.0 */
(function () {
  'use strict';

  var SEL = '.dk-wordart';
  var FONTS = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Nunito:wght@600;700;800&display=swap';
  var PALETTE = ['#1565c0','#2e7d32','#c62828','#6a1b9a','#ef6c00','#00695c','#0277bd','#283593','#ad1457','#5d4037'];

  /* Формы: объединение эллипсов [cx, cy, rx, ry] в долях от размера блока */
  var SHAPES = {
    cloud: [[0.50,0.68,0.495,0.31],[0.22,0.53,0.20,0.24],[0.41,0.35,0.215,0.30],[0.64,0.37,0.20,0.28],[0.83,0.56,0.165,0.22]],
    ellipse: [[0.5,0.5,0.5,0.5]],
    rect: [[0.5,0.5,0.7072,0.7072]]
  };

  var CSS = ''
  + '.dk-wordart{position:relative;width:100%;max-width:1000px;margin:0 auto;box-sizing:border-box;font-family:"Nunito","Segoe UI",Tahoma,sans-serif}'
  + '.dk-wordart .dk-wa-word{position:absolute;text-decoration:none;white-space:nowrap;line-height:1;opacity:0;'
  + 'transform:translate(-50%,-50%) rotate(var(--dk-rot,0deg));transition:transform .18s ease,filter .18s ease,opacity .45s ease}'
  + '.dk-wordart.dk-wa-ready .dk-wa-word{opacity:1}'
  + '.dk-wordart .dk-wa-word:hover,.dk-wordart .dk-wa-word:focus{transform:translate(-50%,-50%) rotate(var(--dk-rot,0deg)) scale(1.16);'
  + 'filter:saturate(1.3) drop-shadow(0 3px 8px rgba(0,0,0,.28));z-index:20;outline:none}'
  + '.dk-wordart .dk-wa-key{font-family:"Comfortaa","Nunito",sans-serif;letter-spacing:.2px}'
  + '.dk-wordart.dk-wa-flow{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:5px 9px;padding:10px 4px;height:auto!important}'
  + '.dk-wordart.dk-wa-flow .dk-wa-word{position:static;transform:none;opacity:1;padding:2px 4px}'
  + '.dk-wordart.dk-wa-flow .dk-wa-word:hover{transform:scale(1.12)}'
  + '.dk-wa-status{padding:26px 10px;text-align:center;color:#546e7a;font-size:14px}'
  + '.dk-wa-hint{max-width:1000px;margin:8px auto 0;text-align:center;font-size:12px;color:#78909c;font-family:"Nunito",sans-serif}'
  + '@media (prefers-reduced-motion:reduce){.dk-wordart .dk-wa-word{transition:none}}';

  function inject() {
    if (!document.getElementById('dk-wa-style')) {
      var s = document.createElement('style'); s.id = 'dk-wa-style'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById('dk-wa-fonts')) {
      var l = document.createElement('link'); l.id = 'dk-wa-fonts'; l.rel = 'stylesheet'; l.href = FONTS;
      document.head.appendChild(l);
    }
  }

  function host(u) { try { return new URL(u, location.href).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

  function normalize(data) {
    var raw = Array.isArray(data) ? data : (data.words || data.tags || []);
    var seen = {}, out = [];
    raw.forEach(function (w) {
      if (typeof w === 'string') w = { text: w };
      var t = String(w.text || w.word || '').trim();
      if (!t || seen[t.toLowerCase()]) return;
      seen[t.toLowerCase()] = 1;
      out.push({
        text: t,
        url: w.url || w.link || '#',
        weight: Math.max(1, +w.weight || +w.size || 5),
        color: w.color || null,
        angle: (w.angle === 90 || w.angle === -90) ? w.angle : 0
      });
    });
    out.sort(function (a, b) { return b.weight - a.weight; });
    return out;
  }

  function inMask(mask, x, y, bw, bh, W, H) {
    for (var i = 0; i <= 4; i++) {
      for (var j = 0; j <= 2; j++) {
        var px = (x - bw / 2 + bw * i / 4) / W, py = (y - bh / 2 + bh * j / 2) / H, ok = false;
        for (var k = 0; k < mask.length; k++) {
          var e = mask[k], dx = (px - e[0]) / e[2], dy = (py - e[1]) / e[3];
          if (dx * dx + dy * dy <= 1) { ok = true; break; }
        }
        if (!ok) return false;
      }
    }
    return true;
  }

  function hits(arr, x, y, bw, bh) {
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      if (Math.abs(x - p.x) * 2 < bw + p.bw + 2 && Math.abs(y - p.y) * 2 < bh + p.bh + 2) return true;
    }
    return false;
  }

  /* Раскладка по спирали Архимеда. k — общий масштаб шрифта */
  function build(words, W, H, shape, k, relax, ctx) {
    var mask = SHAPES[shape] || SHAPES.cloud;
    var maxV = words[0].weight, minV = words[words.length - 1].weight;
    var maxF = W * 0.058, minF = W * 0.0175;
    var cx = W * 0.5, cy = H * (shape === 'cloud' ? 0.56 : 0.5);
    var diag = Math.sqrt(W * W + H * H);
    var items = [], left = [];

    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var t = maxV > minV ? (w.weight - minV) / (maxV - minV) : 1;
      var size = (minF + (maxF - minF) * Math.pow(t, 1.25)) * k;
      var key = w.weight >= 9;
      var fam = key ? '"Comfortaa","Nunito",sans-serif' : '"Nunito","Segoe UI",sans-serif';
      var fw = key ? 700 : (w.weight >= 7 ? 800 : 700);
      ctx.font = fw + ' ' + size.toFixed(2) + 'px ' + fam;
      var tw = ctx.measureText(w.text).width + size * 0.22, th = size * 1.10;
      var bw = w.angle ? th : tw, bh = w.angle ? tw : th;
      var ok = false, px = cx, py = cy, a = i * 2.39996;

      for (var s = 0; s < 4000; s++) {
        var r = 2.0 * s * 0.13;
        if (r > diag) break;
        var ang = a + s * 0.13;
        px = cx + r * Math.cos(ang) * 1.12;
        py = cy + r * Math.sin(ang) * 0.82;
        if (px - bw / 2 < 1 || px + bw / 2 > W - 1 || py - bh / 2 < 1 || py + bh / 2 > H - 1) continue;
        if (!relax && !inMask(mask, px, py, bw, bh, W, H)) continue;
        if (hits(items, px, py, bw, bh)) continue;
        ok = true; break;
      }
      if (!ok) { if (!relax) return null; left.push(w); continue; }
      items.push({ w: w, x: px, y: py, bw: bw, bh: bh, size: size, fw: fw, key: key });
    }
    return { items: items, left: left };
  }

  function link(p, i, flow) {
    var a = document.createElement('a');
    a.className = 'dk-wa-word' + (p.key ? ' dk-wa-key' : '');
    a.href = p.w.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = p.w.text;
    a.title = p.w.text + (p.w.url !== '#' ? ' — ' + host(p.w.url) : '');
    a.style.fontSize = p.size.toFixed(1) + 'px';
    a.style.fontWeight = p.fw;
    a.style.color = p.w.color || PALETTE[i % PALETTE.length];
    if (!flow) {
      a.style.left = p.x.toFixed(1) + 'px';
      a.style.top = p.y.toFixed(1) + 'px';
      a.style.setProperty('--dk-rot', (p.w.angle || 0) + 'deg');
      a.style.transitionDelay = (i * 9) + 'ms';
    }
    return a;
  }

  function draw(el) {
    var words = el._dkWords; if (!words || !words.length) return;
    var W = Math.round(el.clientWidth || (el.parentNode ? el.parentNode.clientWidth : 900));
    if (W < 60) return;
    var shape = el.getAttribute('data-shape') || el._dkShape || 'cloud';
    var minCloud = +(el.getAttribute('data-min-cloud') || 700);
    var flow = W < minCloud || el.getAttribute('data-layout') === 'flow';

    if (el._dkExtra) { el._dkExtra.remove(); el._dkExtra = null; }
    el.innerHTML = '';
    el.className = 'dk-wordart' + (flow ? ' dk-wa-flow' : '');
    el.style.height = '';

    if (flow) {
      var mx = words[0].weight, mn = words[words.length - 1].weight;
      words.forEach(function (w, i) {
        var t = mx > mn ? (w.weight - mn) / (mx - mn) : 1;
        el.appendChild(link({ w: w, size: 11 + 12 * Math.pow(t, 1.2), fw: w.weight >= 7 ? 800 : 700, key: w.weight >= 9 }, i, true));
      });
      el.classList.add('dk-wa-ready');
      return;
    }

    var H = Math.round(W * (parseFloat(el.getAttribute('data-ratio')) || (shape === 'cloud' ? 0.72 : 0.62)));
    var ctx = el._dkCtx || (el._dkCtx = document.createElement('canvas').getContext('2d'));
    var res = null, k = 1;
    for (var att = 0; att < 16 && !res; att++) { res = build(words, W, H, shape, k, false, ctx); if (!res) k *= 0.92; }
    if (!res) res = build(words, W, H, shape, k, true, ctx);

    el.style.height = H + 'px';
    var frag = document.createDocumentFragment();
    res.items.forEach(function (p, i) { frag.appendChild(link(p, i, false)); });
    el.appendChild(frag);
    requestAnimationFrame(function () { el.classList.add('dk-wa-ready'); });

    if (res.left.length) { /* страховка: неуместившиеся теги — строкой под облаком */
      var extra = document.createElement('div');
      extra.className = 'dk-wordart dk-wa-flow dk-wa-ready';
      res.left.forEach(function (w, i) { extra.appendChild(link({ w: w, size: 13, fw: 700, key: false }, i, true)); });
      el.parentNode.insertBefore(extra, el.nextSibling);
      el._dkExtra = extra;
    }
  }

  function watch(el) {
    var last = el.clientWidth, tm;
    function check() { var w = el.clientWidth; if (Math.abs(w - last) > 24) { last = w; draw(el); } }
    if (window.ResizeObserver) {
      new ResizeObserver(function () { clearTimeout(tm); tm = setTimeout(check, 180); }).observe(el.parentNode || el);
    } else {
      window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(check, 220); });
    }
  }

  function start(el, data) {
    el._dkWords = normalize(data);
    el._dkShape = data.shape || 'cloud';
    if (!el._dkWords.length) { fail(el, 'В JSON нет тегов'); return; }
    var done = false;
    function go() { if (done) return; done = true; draw(el); watch(el); hint(el); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 1500); }
    else setTimeout(go, 400);
  }

  function hint(el) {
    if (el.getAttribute('data-hint') === '0' || el._dkHint) return;
    var d = document.createElement('div');
    d.className = 'dk-wa-hint';
    d.textContent = 'Нажмите на тег — откроется нормативный документ, справочная система или разъяснение';
    el.parentNode.insertBefore(d, el.nextSibling);
    el._dkHint = d;
  }

  function fail(el, e) {
    el.className = 'dk-wordart';
    el.innerHTML = '<div class="dk-wa-status">Не удалось загрузить облако тегов. ' + (e && e.message ? e.message : e) + '</div>';
  }

  function init(el) {
    if (el._dkInit) return; el._dkInit = 1;
    inject();
    var inline = el.querySelector('script[type="application/json"]');
    if (inline) { try { start(el, JSON.parse(inline.textContent)); } catch (e) { fail(el, e); } return; }
    var src = el.getAttribute('data-wordart-src') || el.getAttribute('data-src');
    if (!src) { fail(el, 'Не указан data-wordart-src'); return; }
    el.innerHTML = '<div class="dk-wa-status">Загружаем облако тегов…</div>';
    fetch(src).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { start(el, d); })
      .catch(function (e) { fail(el, e); });
  }

  function initAll() {
    var n = document.querySelectorAll(SEL);
    for (var i = 0; i < n.length; i++) init(n[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
  setTimeout(initAll, 800); setTimeout(initAll, 2000); /* для AJAX-подгрузки контента Moodle */
  window.DKWordArt = { refresh: initAll };
})();