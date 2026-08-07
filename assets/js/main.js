/* 株式会社Life サイト共通スクリプト */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- スマホメニュー ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('globalNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'メニューを開く');
      });
    });
  }

  /* ---------- スクロールでヘッダーを縮める ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- スクロール連動の登場（種類ごとに動きを変える） ---------- */
  // reveal:下から / -l:左から / -r:右から / -zoom:写真が引く /
  // -wipe:左から拭う / -rise:せり上がる / rule-draw:罫線が伸びる / mark:マーカーが塗られる
  var MOTION = '.reveal, .reveal-l, .reveal-r, .reveal-zoom, .reveal-wipe, .reveal-rise, .rule-draw, .mark, .head2';
  var revealTargets = document.querySelectorAll(MOTION);

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    // 画面に入る手前で動き出すよう、判定範囲を下に広げておく
    }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });

    revealTargets.forEach(function (el) {
      // 同じ並びのカードは少しずつ遅らせて出す
      var parent = el.parentElement;
      if (parent && parent.children.length > 1 && !el.style.transitionDelay) {
        var index = Array.prototype.indexOf.call(parent.children, el);
        el.style.transitionDelay = Math.min(index, 4) * 0.08 + 's';
      }
      revealObserver.observe(el);
    });

    var showAll = function () {
      revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    };

    // 安全装置1：2秒経っても画面内にあるのに出ていないものは強制表示する。
    // 画面より下のものは対象にしない（ここを一律にすると、利用者が
    // スクロールする前に全部出てしまい、スクロール時の動きが消える）
    setTimeout(function () {
      var vh = window.innerHeight;
      revealTargets.forEach(function (el) {
        if (el.getBoundingClientRect().top < vh) el.classList.add('is-visible');
      });
    }, 2000);

    // 安全装置2：スクロールできない場合・印刷・自動キャプチャでは全部出す
    if (document.documentElement.scrollHeight <= window.innerHeight + 4) showAll();
    window.addEventListener('beforeprint', showAll);
    setTimeout(showAll, 12000);
  }

  /* ---------- 背景写真のゆるいパララックス ---------- */
  // 帯や大きな写真が、スクロール量に対してわずかに遅れて動く
  var parallaxItems = document.querySelectorAll('[data-parallax]');
  if (parallaxItems.length && !reduceMotion) {
    parallaxItems.forEach(function (el) { el.classList.add('parallax-in'); });
    var ticking = false;
    var applyParallax = function () {
      var vh = window.innerHeight;
      parallaxItems.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var amount = parseFloat(el.dataset.parallax) || 12;
        // 要素が画面中央にある時を0として、上下に動かす
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (progress * amount).toFixed(2) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(applyParallax); }
    }, { passive: true });
    window.addEventListener('resize', applyParallax, { passive: true });
    applyParallax();
  }

  /* ---------- 流れ：開いた項目に合わせて右の写真を入れ替える ---------- */
  // 参考: アパックスホームの「アパート経営の流れ」。details/summaryで組むので
  // JSが動かなくても開閉自体は機能し、内容は必ず読める。
  document.querySelectorAll('.flow2').forEach(function (flow) {
    var items = flow.querySelectorAll('.flow2-item');
    var visual = flow.querySelector('.flow2-visual');
    var cap = flow.querySelector('.flow2-cap');
    if (!items.length || !visual || !cap) return;

    var big = cap.querySelector('.big');
    var en = cap.querySelector('.en');
    var slides = visual.querySelectorAll('img');

    var show = function (index) {
      slides.forEach(function (img, i) { img.classList.toggle('is-on', i === index); });
      var item = items[index];
      if (!item) return;
      cap.classList.add('is-swapping');
      setTimeout(function () {
        big.textContent = item.dataset.no || '';
        en.textContent = item.dataset.en || '';
        cap.classList.remove('is-swapping');
      }, reduceMotion ? 0 : 220);
    };

    items.forEach(function (item, i) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        // 手風琴：ひとつ開いたら他は閉じる
        items.forEach(function (other) { if (other !== item) other.open = false; });
        show(i);
      });
      // マウスを乗せただけでも写真が切り替わる（開閉はしない）
      item.addEventListener('mouseenter', function () { show(i); });
    });

    // 開いている項目に合わせる（初期は1つ目）
    var openIndex = 0;
    items.forEach(function (item, i) { if (item.open) openIndex = i; });
    if (!items[openIndex].open) items[openIndex].open = true;
    show(openIndex);
  });

  /* ---------- 実績カルーセル（左右の矢印で送る） ---------- */
  document.querySelectorAll('.works-slider').forEach(function (slider) {
    var track = slider.querySelector('.ws-track');
    var cards = slider.querySelectorAll('.ws-card');
    var prev = slider.querySelector('.ws-prev');
    var next = slider.querySelector('.ws-next');
    if (!track || !cards.length || !prev || !next) return;

    var index = 0;
    var perView = function () {
      var w = slider.clientWidth;
      if (w < 460) return 1;
      if (w < 767) return 2;
      if (w < 1000) return 3;
      return 4;
    };
    var maxIndex = function () { return Math.max(0, cards.length - perView()); };

    var render = function () {
      if (index > maxIndex()) index = maxIndex();
      var card = cards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).gap) || 18;
      track.style.transform = 'translateX(' + (-index * (card + gap)) + 'px)';
      prev.disabled = index <= 0;
      next.disabled = index >= maxIndex();
    };

    prev.addEventListener('click', function () { index = Math.max(0, index - 1); render(); });
    next.addEventListener('click', function () { index = Math.min(maxIndex(), index + 1); render(); });
    window.addEventListener('resize', render, { passive: true });
    render();
  });

  /* ---------- 数字のカウントアップ ---------- */
  var counters = document.querySelectorAll('.count');
  var runCount = function (el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.dec || '0', 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }

    var duration = 1500;
    var start = null;
    var step = function (timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // 終わりに向かって減速させる
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(runCount);
  } else {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }
})();
