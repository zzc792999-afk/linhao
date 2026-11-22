'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const root = $('banter');
  if (!root) return;
  const status = $('banter-status');
  const retry = $('banter-retry');
  const picks = $('banter-picks');
  const outcome = $('banter-result');
  const shot = $('banter-ending');
  const fallback = $('banter-share-text');
  let data, busy = false, started = false, displayedChoice;

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function option(choice, action) {
    const button = element('button', choice.text);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
  }

  function showEnding(choice, practice = false) {
    displayedChoice = choice;
    $('banter-ending-label').textContent = practice ? '试拍结局' : '我的接话';
    $('banter-quote').textContent = choice.text;
    $('banter-reaction').textContent = choice.reaction;
    fallback.hidden = true;
    shot.classList.remove('banter-ending-pop');
    requestAnimationFrame(() => shot.classList.add('banter-ending-pop'));
  }

  function drawVotes() {
    $('banter-total').textContent = '同学怎么接 · ' + data.total + ' 票';
    const entries = data.scene.choices.map(choice => ({choice, count: data.counts[choice.id] || 0}));
    entries.sort((a,b) => b.count - a.count);
    $('banter-votes').replaceChildren(...entries.map(({choice,count}) => {
      const row = element('li');
      const meter = element('progress');
      meter.max = data.total || 1;
      meter.value = count;
      meter.setAttribute('aria-label', choice.text + '有' + count + '票');
      row.append(element('span', choice.text), element('span', count + ' 票'), meter);
      return row;
    }));
  }

  function draw(next) {
    const dayChanged = next.day !== data?.day;
    data = next;
    $('banter-scene').hidden = false;
    $('banter-day').textContent = data.day.slice(5).replace('-', ' 月 ') + ' 日';
    $('banter-tag').textContent = data.scene.tag;
    $('banter-scene-title').textContent = data.scene.title;
    $('banter-line').textContent = data.scene.line;
    const picked = data.scene.choices.find(choice => choice.id === data.choice);
    picks.hidden = Boolean(picked);
    outcome.hidden = !picked;
    retry.hidden = true;
    if (!picked) {
      $('banter-options').replaceChildren(...data.scene.choices.map(choice => option(choice, () => load(choice))));
      return;
    }
    if (dayChanged) $('banter-practice').open = false;
    showEnding(picked);
    $('banter-other-options').replaceChildren(...data.scene.choices.map(choice =>
      option(choice, () => showEnding(choice, choice.id !== data.choice))));
    drawVotes();
  }

  async function request(choice) {
    const response = await fetch('/api/banter', {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(18000),
      ...(choice ? {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({day: data.day, scene: data.scene.id, choice: choice.id})
      } : {})
    });
    const json = await response.json().catch(() => ({}));
    if (choice && response.status === 409) return null;
    if (!response.ok || !json.scene) throw Error(json.error || '接梗暂时连不上，请稍后重试。');
    return json;
  }

  async function load(choice) {
    if (busy) return;
    busy = true;
    const buttons = [retry, $('banter-sync'), ...picks.querySelectorAll('button')];
    buttons.forEach(button => button.disabled = true);
    status.textContent = choice ? '正在揭晓结局…' : '正在同步今日场景…';
    try {
      const response = await request(choice);
      draw(response || await request());
      status.textContent = !response ? '新的一天已经开始，来看看新情景。' : choice ? '结局已解锁。' : '';
      if (choice && !outcome.hidden) outcome.focus({preventScroll: true});
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? '同步超时，请再试一次。' : error.message;
      retry.hidden = false;
    } finally {
      busy = false;
      buttons.forEach(button => button.disabled = false);
    }
  }

  async function copyScene() {
    if (!displayedChoice) return;
    const text = [
      '【25计算机1 · 课间接梗】' + data.scene.title,
      data.scene.line,
      '我接：' + displayedChoice.text,
      '结局：' + displayedChoice.reaction,
      new URL('/#banter', location.origin).href
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      fallback.hidden = true;
      status.textContent = '已复制这一幕和游戏链接。';
    } catch {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = '选中台词并复制，就能发给同学。';
    }
  }

  if (document.body.dataset.mode !== 'live') {
    status.textContent = '请打开班级正式站参加今日接梗。';
    return;
  }
  retry.addEventListener('click', () => load());
  $('banter-sync').addEventListener('click', () => load());
  $('banter-copy').addEventListener('click', copyScene);
  document.addEventListener('visibilitychange', () => {
    if (started && !document.hidden) load();
  });

  function start() {
    if (started) return;
    started = true;
    if (typeof classReady !== 'undefined' && !classReady) {
      const waiting = setTimeout(() => load(), 5000);
      window.addEventListener('class-synced', () => {
        clearTimeout(waiting);
        if (!data) load();
      }, {once: true});
    } else {
      load();
    }
  }

  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      near.disconnect();
      start();
    }, {rootMargin: '220px'});
    near.observe(root);
  } else {
    start();
  }
})();
