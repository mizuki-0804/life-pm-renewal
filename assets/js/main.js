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

  /* ---------- スクロール連動フェードイン ---------- */
  var revealTargets = document.querySelectorAll('.reveal');
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
        el.style.transitionDelay = Math.min(index, 3) * 0.07 + 's';
      }
      revealObserver.observe(el);
    });

    // 安全装置：スクロールを検知できない見方（自動キャプチャ・印刷・
    // 一部の読み上げ環境など）でも、しばらくしたら必ず出す
    setTimeout(function () {
      revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2500);
  }

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
