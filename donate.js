(function () {
  'use strict';

  var C = window.DONATE_CONFIG || {};
  var METRIKA_ID = 49279987;
  var PAGE_URL = 'https://bot.annaserba.ru/';
  var MAX_AMOUNT = 100000;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function track(name, params) {
    try {
      if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', name, params || {});
    } catch (e) { /* статистика не должна ломать страницу */ }
  }

  function money(n) {
    return new Intl.NumberFormat('ru-RU').format(n);
  }

  function plural(n, forms) {
    var a = Math.abs(n) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  function clamp(n) {
    if (!isFinite(n)) return C.defaultAmount || 300;
    return Math.max(1, Math.min(MAX_AMOUNT, Math.round(n)));
  }

  function cost() {
    return Math.max(1, Number(C.monthlyCost) || 500);
  }

  function impact(amount) {
    var month = cost();
    var months = amount / month;
    if (months >= 1.85) {
      var m = Math.round(months);
      return '≈ ' + m + ' ' + plural(m, ['месяц', 'месяца', 'месяцев']) + ' сервера';
    }
    if (months >= 0.9) return '≈ месяц сервера';
    var days = Math.max(1, Math.round(amount / (month / 30)));
    return '≈ ' + days + ' ' + plural(days, ['день', 'дня', 'дней']) + ' сервера';
  }

  function telegramHref(amount) {
    var base = C.telegram || 'https://t.me/annserba94';
    var text = 'Хочу поддержать сервер бота «ПОР 48 и 48/1» — ' + money(amount) + ' ₽. Пришлите, пожалуйста, ссылку на оплату.';
    try {
      var u = new URL(base);
      u.searchParams.set('text', text);
      return u.toString();
    } catch (e) {
      return base;
    }
  }

  function paymentHref(amount) {
    var url = (C.paymentUrl || '').trim();
    if (!url) return telegramHref(amount);
    if (url.indexOf('{amount}') !== -1) return url.replace(/\{amount\}/g, String(amount));
    if (C.amountParam) {
      try {
        var u = new URL(url, window.location.href);
        u.searchParams.set(C.amountParam, String(amount));
        return u.toString();
      } catch (e) {
        return url;
      }
    }
    return url;
  }

  function toast(message) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  /* ---------- Сумма и кнопки оплаты ---------- */

  var amount = clamp(Number(C.defaultAmount) || 300);
  var chips = $$('.amount');
  var custom = $('[data-custom]');

  function setChipState(value) {
    chips.forEach(function (chip) {
      var on = Number(chip.getAttribute('data-amount')) === value;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function updatePayLinks() {
    var fallback = !(C.paymentUrl || '').trim();
    var href = paymentHref(amount);
    $$('[data-pay]').forEach(function (link) {
      link.href = href;
      if (fallback) {
        link.target = '_blank';
        link.rel = 'noopener';
      } else {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
      if (link.classList.contains('btn--block') && link.parentElement && link.parentElement.classList.contains('sticky__in')) {
        link.textContent = 'Поддержать';
      } else {
        link.textContent = 'Поддержать на ' + money(amount) + ' ₽';
      }
    });

    var stickyAmount = $('[data-sticky-amount]');
    if (stickyAmount) stickyAmount.textContent = money(amount);

    var hint = $('[data-pay-hint]');
    if (hint) {
      hint.textContent = fallback
        ? 'Откроется Telegram — пришлю ссылку на оплату и чек.'
        : 'Откроется страница оплаты. Карта или СБП, без подписки.';
    }
  }

  function setAmount(value, opts) {
    amount = clamp(value);
    setChipState(amount);
    if (custom && opts && opts.fromChip) custom.value = '';
    updatePayLinks();
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var v = Number(chip.getAttribute('data-amount'));
      setAmount(v, { fromChip: true });
      track('donate_amount', { amount: v });
    });
  });

  if (custom) {
    custom.addEventListener('input', function () {
      var digits = custom.value.replace(/[^\d]/g, '').slice(0, 6);
      if (custom.value !== digits) custom.value = digits;
      var v = Number(digits);
      if (v > 0) {
        amount = clamp(v);
        setChipState(-1);
        updatePayLinks();
      }
    });
    custom.addEventListener('blur', function () {
      var v = Number(custom.value);
      if (!v) {
        setAmount(Number(C.defaultAmount) || 300);
        return;
      }
      setAmount(v);
      custom.value = String(amount);
    });
  }

  $$('[data-pay]').forEach(function (link) {
    link.addEventListener('click', function () {
      track('donate_go', { amount: amount, method: (C.paymentUrl || '').trim() ? 'link' : 'telegram' });
    });
  });

  /* ---------- Ссылки на бота и Telegram ---------- */

  var botUrl = C.botUrl || 'https://max.ru/se14972607_bot';
  $$('[data-bot]').forEach(function (link) {
    link.href = botUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.addEventListener('click', function () { track('donate_bot'); });
  });

  var tgUrl = C.telegram || 'https://t.me/annserba94';
  $$('[data-tg]').forEach(function (link) {
    if (!link.closest('.faq')) link.href = tgUrl;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  /* ---------- Цифры ---------- */

  var month = cost();
  $$('[data-cost]').forEach(function (el) { el.textContent = money(month); });
  var goalEls = $$('[data-goal]');
  goalEls.forEach(function (el) { el.textContent = money(month); });
  var monthEl = $('[data-month]');
  if (monthEl && C.monthLabel) monthEl.textContent = C.monthLabel;

  var legalEl = $('[data-legal]');
  if (legalEl) {
    legalEl.textContent = (C.legal || 'Анна Серба, самозанятая (НПД)') + (C.inn ? ' · ИНН ' + C.inn : '');
  }

  $$('[data-impact]').forEach(function (el) {
    var chip = el.closest('.amount');
    if (chip) el.textContent = impact(Number(chip.getAttribute('data-amount')));
  });

  /* ---------- Прогресс ---------- */

  var progress = $('[data-progress]');
  if (progress) {
    var known = typeof C.collected === 'number' && isFinite(C.collected) && C.collected >= 0;
    var collected = known ? Math.round(C.collected) : 0;
    var pct = known ? Math.max(0, Math.min(100, Math.round(collected / month * 100))) : 0;

    var title = $('[data-progress-title]');
    var nums = $('[data-progress-nums]');
    var bar = $('[data-bar]');
    var barWrap = $('[data-bar-wrap]');
    var note = $('[data-progress-note]');
    var collectedEl = $('[data-collected]');

    if (!known) {
      progress.setAttribute('data-state', 'open');
      if (title) title.textContent = 'Сбор только открылся';
      if (note) note.textContent = 'Цель — ' + money(month) + ' ₽. Первый донат запускает месяц — прогресс появится здесь.';
    } else {
      progress.setAttribute('data-state', pct >= 100 ? 'done' : 'active');
      if (title) title.textContent = pct >= 100 ? 'Сервер оплачен — спасибо' : 'Сбор идёт';
      if (nums) nums.hidden = false;
      if (collectedEl) collectedEl.textContent = money(collected);
      if (bar) window.setTimeout(function () { bar.style.width = pct + '%'; }, 350);
      if (barWrap) barWrap.setAttribute('aria-valuenow', String(pct));
      if (note) {
        note.textContent = pct >= 100
          ? 'Собрано ' + money(collected) + ' ₽. Остаток пойдёт на следующий месяц.'
          : 'Собрано ' + money(collected) + ' ₽ из ' + money(month) + ' ₽. Деньги идут только на хостинг.';
      }
    }
  }

  /* ---------- Липкая кнопка ---------- */

  var sticky = $('[data-sticky]');
  var payCard = $('#pay-card') || $('#support');

  function syncSticky() {
    if (!sticky) return;
    var inSupport = false;
    if (payCard) {
      var r = payCard.getBoundingClientRect();
      inSupport = r.top < window.innerHeight * 0.96 && r.bottom > 0;
    }
    var show = window.scrollY > 680 && !inSupport;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  window.addEventListener('scroll', syncSticky, { passive: true });
  window.addEventListener('resize', syncSticky);
  syncSticky();

  /* ---------- Поделиться ---------- */

  var shareBtn = $('[data-share]');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      track('donate_share');
      if (navigator.share) {
        navigator.share({
          title: 'Бот «ПОР 48 и 48/1»',
          text: 'Бот следит за светом и пишет, когда он пропал или вернулся. Поддержите сервер, на котором он живёт.',
          url: PAGE_URL
        }).catch(function () {});
        return;
      }
      var done = function () { toast('Ссылка скопирована — отправьте соседу'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(PAGE_URL).then(done, function () { toast(PAGE_URL); });
        return;
      }
      var ta = document.createElement('textarea');
      ta.value = PAGE_URL;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast(PAGE_URL); }
      document.body.removeChild(ta);
    });
  }

  /* ---------- Год ---------- */

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Старт ---------- */

  setAmount(amount);
  var matching = chips.some(function (chip) { return Number(chip.getAttribute('data-amount')) === amount; });
  if (!matching && custom) custom.value = String(amount);
})();
