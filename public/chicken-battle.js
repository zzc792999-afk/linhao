'use strict';
(() => {
  const henEggArt = `<svg viewBox="0 0 48 52" aria-hidden="true">
    <path d="M24 5C15 5 7 24 7 34a17 17 0 1 0 34 0C41 24 33 5 24 5Z" fill="#fff1cb" stroke="#503824" stroke-width="2.5"/>
    <path d="M13 35q6 10 18 8" fill="none" stroke="#dbac70" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="29" r="1.5" fill="#d8a371"/><circle cx="30" cy="35" r="2" fill="#d8a371"/>
  </svg>`;
  const henChickArt = `<svg viewBox="0 0 56 58" aria-hidden="true">
    <g stroke="#503824" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m22 41-3 12-7 1m20-12 4 10 7 1" fill="none"/>
      <path d="M16 24q-4-9 3-12l5 4q-1-10 5-9l4 9q14 2 12 17-1 13-17 13Q9 47 9 34q0-7 7-10Z" fill="#ffda73"/>
      <path d="m43 26 10 5-10 4" fill="#f19b43"/>
      <path d="M18 33q4 7 11 2" fill="none"/>
      <circle cx="36" cy="24" r="5" fill="#fff6dc"/><circle cx="37" cy="25" r="1.25" fill="#503824" stroke="none"/>
    </g>
  </svg>`;
  const nestArt = `<svg class="hen-nest-art" viewBox="0 0 174 66" aria-hidden="true">
    <ellipse cx="87" cy="59" rx="67" ry="4" fill="#63452d" opacity=".17"/>
    <path d="M10 30q17-14 77-14t77 14l-13 13H23Z" fill="#a97a4e" stroke="#68462d" stroke-width="2"/>
    <path d="M12 31q27-9 75-9t75 9q-11 26-75 27-63-1-75-27Z" fill="#d9ad69" stroke="#68462d" stroke-width="2"/>
    <path d="M16 34q23 9 71 10t71-10M24 43q25 11 63 10t63-10" fill="none" stroke="#a67645" stroke-width="1.5"/>
    <path d="m29 34 12 6m7-8 14 8m48 3 15-7m-1 11 15-7" stroke="#f4cf83" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 40 3 34m17 11-9 2m145-9 14-9m-10 13 10 1" stroke="#a67645" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  const sleepyChickArt = `<svg viewBox="0 0 40 35" aria-hidden="true">
    <path d="M8 25q-5-7 1-14l6 1q-2-6 3-6l4 4q10-1 12 10l4 4-5 3q-9 8-21 3Z"
      fill="#ffda79" stroke="#66482f" stroke-width="2.1" stroke-linejoin="round"/>
    <path d="m34 20 4 4-5 1M24 19q2 3 5 0M14 24q3 4 7 1" fill="none"
      stroke="#66482f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="27" cy="24" rx="3.4" ry="1.7" fill="#ed9c76"/>
  </svg>`;
  const start = () => {
    if (document.getElementById('wandering-hen')) return;
    const hen = document.createElement('button');
    hen.id = 'wandering-hen';
    hen.type = 'button';
    hen.className = 'wandering-hen';
    hen.innerHTML = `<svg class="weird-hen-art" viewBox="0 0 120 140" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#29221c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path class="hen-leg-a" d="M48 103l-8 23-14 3m14-3 10 7" fill="none"/>
        <path class="hen-leg-b" d="M68 104l9 22 17-2m-17 2-5 9" fill="none"/>
        <g class="hen-wobble">
          <path d="M31 73 9 52l5 27L5 76l22 23" fill="#e76a48"/>
          <path d="M27 79Q12 112 55 113Q88 113 85 87L80 48 94 41 87 28 67 32 61 78Q43 68 27 79Z" fill="#fff4d3"/>
          <path d="M39 83q-16 14 9 16l10-11" fill="#e7ce8b"/>
          <path d="m69 31-9-14q-2-9 8-5l7 10-1-16q6-8 10 2l1 13 7-10q11-3 8 7l-12 15" fill="#ef4f50"/>
          <path d="m89 44 24 10-24 5Z" fill="#ffb735"/>
          <path d="M86 59q12 16 0 16-10-3-6-15" fill="#ef4f50"/>
          <g class="hen-open-eyes">
            <ellipse cx="72" cy="42" rx="10" ry="12" fill="white"/>
            <ellipse cx="88" cy="39" rx="8" ry="9" fill="white"/>
            <path d="m70 43 1 4m19-12 1 3" stroke-width="5"/>
          </g>
          <path class="hen-closed-eyes" d="M68 40q4 7 9 0m6-2q4 6 8 0" fill="none"/>
          <path d="m65 64 8 2m-9 5 6 2" stroke="#c8ad79" stroke-width="2"/>
        </g>
      </g></svg>`;
    hen.setAttribute('aria-label', '点击小鸡下蛋');
    const nest = document.createElement('div');
    nest.className = 'hen-nest';
    nest.innerHTML = nestArt;
    nest.setAttribute('aria-hidden', 'true');
    nest.hidden = true;
    const restingChicks = document.createElement('div');
    restingChicks.className = 'hen-nest-chicks';
    nest.append(restingChicks);
    const flock = document.createElement('div');
    flock.className = 'hen-flock';
    flock.setAttribute('aria-hidden', 'true');
    const notice = document.createElement('div');
    notice.className = 'hen-notice';
    notice.setAttribute('role', 'status');
    document.body.append(nest, hen, flock, notice);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const clock = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', hourCycle: 'h23'
    });
    const chickParts = [];
    let x = 24, direction = 1, henWidth = 100, last = 0, frame = null;
    let sleeping = false, goingHome = false, restTime = false, pausedUntil = 0;
    let day = '', crowedDay = '', noticeTimer, egg = null, eggTimer;
    let flockCount = 0, hatched = false, syncing = false, hatching = false, flockRevision = 0;
    let audioContext;

    const edge = () => Math.max(0, innerWidth - henWidth);
    const home = () => Math.max(0, Math.min(edge(), innerWidth - 97 - henWidth / 2));
    const clampEgg = left => Math.max(0, Math.min(innerWidth - 48, left));
    const say = message => {
      notice.textContent = message;
      notice.classList.add('visible');
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => notice.classList.remove('visible'), 2200);
    };
    function updateTitle() {
      hen.title = '全班今天孵出了 ' + flockCount + ' 只小鸡 · ' +
        (sleeping ? '鸡群已归巢' : hatched ? '你今天已经孵过了' : '点我下蛋，再点蛋孵小鸡');
    }
    function unlockAudio() {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio && !audioContext) audioContext = new Audio();
        audioContext?.resume().catch(() => {});
      } catch {}
    }
    function crow() {
      say('喔喔喔！早上好');
      hen.classList.add('hen-crowing');
      setTimeout(() => hen.classList.remove('hen-crowing'), 1300);
      if (audioContext?.state !== 'running') return;
      const start = audioContext.currentTime + .04;
      for (const [index, frequency] of [410, 520, 440, 360].entries()) {
        const at = start + index * .16;
        const voice = audioContext.createOscillator();
        const volume = audioContext.createGain();
        voice.type = 'triangle';
        voice.frequency.setValueAtTime(frequency, at);
        voice.frequency.exponentialRampToValueAtTime(frequency * .8, at + .14);
        volume.gain.setValueAtTime(.001, at);
        volume.gain.exponentialRampToValueAtTime(.08, at + .04);
        volume.gain.exponentialRampToValueAtTime(.001, at + .15);
        voice.connect(volume).connect(audioContext.destination);
        voice.start(at);
        voice.stop(at + .16);
      }
    }
    function clearEgg() {
      clearTimeout(eggTimer);
      egg?.remove();
      egg = null;
    }
    function renderPositions(now = 0) {
      const moving = !sleeping && !reduced.matches && now > pausedUntil;
      const hop = moving ? Math.abs(Math.sin(now / 130)) * 5 : 0;
      const tilt = moving ? Math.sin(now / 130) * 7 : 0;
      hen.style.left = `${x}px`;
      hen.style.transform = `scaleX(${direction}) translateY(${-hop}px) rotate(${tilt}deg)`;
      if (sleeping) return;
      const columns = Math.max(1, Math.min(10, Math.floor(innerWidth / 44) - 1));
      for (let i = 0; i < chickParts.length; i++) {
        const col = i % columns, row = Math.floor(i / columns);
        const travel = henWidth / 2 + 12 + col * 30;
        const at = x + henWidth / 2 - 22 - direction * travel;
        const padding = Math.max(0, innerWidth - 44);
        const wrapped = at < 0 ? Math.min(padding, -at) : at > padding ? Math.max(0, padding * 2 - at) : at;
        const bounce = moving ? Math.abs(Math.sin(now / 140 - i * .75)) * 4 : 0;
        chickParts[i].style.transform = `translate3d(${wrapped}px,${-Math.min(row * 19, 76) - bounce}px,0) scaleX(${direction})`;
      }
    }
    function renderNestChicks() {
      const visible = sleeping ? Math.min(flockCount, 5) : 0;
      while (restingChicks.childElementCount > visible) restingChicks.lastElementChild.remove();
      while (restingChicks.childElementCount < visible) {
        const chick = document.createElement('span');
        chick.innerHTML = sleepyChickArt;
        restingChicks.append(chick);
      }
    }
    function setSleeping(value) {
      sleeping = value;
      hen.classList.toggle('hen-sleeping', value);
      flock.classList.toggle('hen-sleeping', value);
      renderNestChicks();
    }
    function setFlock(total) {
      flockCount = total;
      while (chickParts.length > total) chickParts.pop().remove();
      while (chickParts.length < total) {
        const chick = document.createElement('span');
        chick.className = 'hen-chick';
        chick.innerHTML = henChickArt;
        flock.append(chick);
        chickParts.push(chick);
      }
      renderNestChicks();
      renderPositions();
      updateTitle();
    }
    function readClock() {
      const parts = Object.fromEntries(clock.formatToParts().map(({type,value}) => [type,value]));
      const today = `${parts.year}-${parts.month}-${parts.day}`;
      if (day !== today) {
        day = today;
        hatched = false;
        clearEgg();
        setFlock(0);
      }
      const hour = Number(parts.hour);
      const newRestTime = hour >= 20 || hour < 8;
      const firstClock = !nest.dataset.ready;
      nest.dataset.ready = 'true';
      if (firstClock || newRestTime !== restTime) {
        restTime = newRestTime;
        setSleeping(restTime && (firstClock || reduced.matches));
        goingHome = restTime && !sleeping;
        nest.hidden = !restTime;
        if (sleeping) x = home();
        if (!restTime && x >= home()) direction = -1;
        renderPositions();
        updateTitle();
        updateMotion();
      }
      if (!document.hidden && hour >= 8 && hour < 10 && crowedDay !== day) {
        const key = 'class2501-hen-crow-day';
        try { crowedDay = localStorage.getItem(key) || crowedDay; } catch {}
        if (crowedDay !== day) {
          crowedDay = day;
          try { localStorage.setItem(key, day); } catch {}
          crow();
        }
      }
    }
    async function getFlock(method = 'GET') {
      const response = await fetch('/api/arcade/chicks', {
        method, credentials: 'same-origin', signal: AbortSignal.timeout(12000),
        ...(method === 'POST' ? {headers: {'Content-Type': 'application/json'}, body: '{}'} : {})
      });
      if (!response.ok) throw Error('鸡群暂时连不上，稍后再试');
      return response.json();
    }
    function applyFlock(state) {
      if (state.day !== day) readClock();
      if (state.day !== day) return;
      hatched = state.hatched;
      setFlock(state.total);
      if (hatched) clearEgg();
    }
    async function syncFlock() {
      if (syncing || hatching || document.hidden || document.body.dataset.mode !== 'live') return;
      syncing = true;
      const revision = flockRevision;
      try {
        const state = await getFlock();
        if (revision === flockRevision && !hatching) applyFlock(state);
      } catch {} finally { syncing = false; }
    }
    async function hatch(event) {
      if (hatching) return;
      hatching = true;
      flockRevision++;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const state = await getFlock('POST');
        applyFlock(state);
        clearEgg();
        if (event.detail === 0) hen.focus({preventScroll: true});
        say(state.created ? '滚木！小鸡孵出来啦' : '你今天已经孵过一只了');
      } catch {
        if (button.isConnected) button.disabled = false;
        say('孵化请求没连上，点鸡蛋再试一次');
      } finally { hatching = false; }
    }
    hen.addEventListener('click', () => {
      unlockAudio();
      if (document.body.dataset.mode !== 'live') { say('请到班级正式网站孵小鸡'); return; }
      if (hatching) return;
      if (hatched) { say('你今天已经孵过一只了'); return; }
      if (egg) { say('点鸡蛋，孵出小鸡'); return; }
      const left = x - 52, right = x + henWidth + 4;
      const behind = direction > 0 ? left : right;
      const beside = direction > 0 ? right : left;
      const at = sleeping ? clampEgg(left) : clampEgg(behind) === behind ? behind : clampEgg(beside);
      egg = document.createElement('button');
      egg.type = 'button';
      egg.className = 'hen-egg';
      egg.innerHTML = henEggArt;
      egg.style.left = `${at}px`;
      egg.title = '点一下孵出小鸡';
      egg.setAttribute('aria-label', egg.title);
      egg.addEventListener('click', hatch);
      document.body.append(egg);
      eggTimer = setTimeout(clearEgg, 30000);
      hen.classList.add('hen-laying');
      setTimeout(() => hen.classList.remove('hen-laying'), 650);
      pausedUntil = performance.now() + 300;
    });

    function walk(now) {
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now;
      if (goingHome) {
        const remaining = home() - x;
        if (Math.abs(remaining) <= 3) {
          x = home();
          goingHome = false;
          setSleeping(true);
          updateTitle();
        } else {
          direction = Math.sign(remaining);
          x += direction * Math.min(Math.abs(remaining), dt * 105);
        }
      } else if (!sleeping && now > pausedUntil) {
        x = Math.min(edge(), Math.max(0, x + direction * dt * 36));
        if (x >= edge()) direction = -1;
        else if (x <= 0) direction = 1;
      }
      renderPositions(now);
      frame = sleeping ? null : requestAnimationFrame(walk);
    }
    function updateMotion() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      last = 0;
      const paused = document.hidden || reduced.matches || sleeping || hen.hidden ||
        document.body.classList.contains('hen-resting');
      if (reduced.matches && goingHome) {
        x = home();
        goingHome = false;
        setSleeping(true);
        renderPositions();
      }
      hen.classList.toggle('hen-paused', paused);
      if (!paused) frame = requestAnimationFrame(walk);
    }
    function resize() {
      henWidth = hen.offsetWidth || 100;
      x = sleeping ? home() : Math.min(edge(), x);
      if (egg) egg.style.left = `${clampEgg(parseFloat(egg.style.left))}px`;
      renderPositions();
    }
    window.addEventListener('resize', resize);
    window.addEventListener('class-hen-preference', updateMotion);
    window.addEventListener('online', syncFlock);
    reduced.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', () => {
      readClock();
      updateMotion();
      if (!document.hidden) syncFlock();
    });
    resize();
    readClock();
    syncFlock();
    setInterval(() => { if (!document.hidden) readClock(); }, 15000);
    setInterval(syncFlock, 30000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
(() => {
  const $ = s => document.querySelector(s);
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };

  // 1. Audio synthesis
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playMuyuSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  function playBasketballSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.75, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }

  function playThunderSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  // 2. HP Management & Server Sync
  const HP_KEY = 'class2501_mascots_hp';

  function getHpMap() {
    try {
      return JSON.parse(localStorage.getItem(HP_KEY)) || {};
    } catch {
      return {};
    }
  }

  function getMascotHp(id) {
    const map = getHpMap();
    return typeof map[id] === 'number' ? map[id] : 100;
  }

  function setMascotHp(id, hp) {
    const map = getHpMap();
    map[id] = Math.max(0, Math.min(100, Math.round(hp)));
    try {
      localStorage.setItem(HP_KEY, JSON.stringify(map));
    } catch {}
    updateHpUi(id);
    return map[id];
  }

  async function syncHpsFromServer() {
    try {
      const res = await fetch('/api/arcade/mascot-hps', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.hps) {
          const map = getHpMap();
          Object.assign(map, data.hps);
          localStorage.setItem(HP_KEY, JSON.stringify(map));
          Object.keys(map).forEach(id => updateHpUi(id));
        }
      }
    } catch {}
    try {
      const resLogs = await fetch('/api/arcade/battle-logs', { signal: AbortSignal.timeout(5000) });
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        if (Array.isArray(dataLogs.battleLogs)) {
          renderBattleLogsSection(dataLogs.battleLogs);
        }
      }
    } catch {}
  }

  function showDmgPop(targetEl, text, isHeal = false) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const pop = el('div', text, 'dmg-pop' + (isHeal ? ' heal' : ''));
    pop.style.left = (rect.left + rect.width / 2 - 40 + (Math.random() * 20 - 10)) + 'px';
    pop.style.top = (rect.top + 20) + 'px';
    document.body.append(pop);
    setTimeout(() => pop.remove(), 1400);
  }

  function updateHpUi(id) {
    const card = document.querySelector(`.arcade-pet-card[data-arcade-pet="${id}"]`);
    if (!card) return;
    const hp = getMascotHp(id);
    const fill = card.querySelector('.pet-hp-bar-fill');
    const count = card.querySelector('.pet-hp-count');
    if (fill) {
      fill.style.width = hp + '%';
      fill.className = 'pet-hp-bar-fill' + (hp < 30 ? ' low' : hp < 60 ? ' mid' : '');
    }
    if (count) count.textContent = hp + ' HP';
  }

  // Real-time Battle Broadcast Section (Visible to Everyone)
  function renderBattleLogsSection(logs = []) {
    const petsPanel = $('#arcade-pets');
    if (!petsPanel) return;
    let broadcastSection = $('#mascot-battle-broadcast-section');
    if (!broadcastSection) {
      broadcastSection = el('div', undefined, 'battle-broadcast-section');
      broadcastSection.id = 'mascot-battle-broadcast-section';
      const head = el('div', undefined, 'battle-broadcast-head');
      const title = el('h3', '⚔️ 吉祥物决斗实时战报 · 全班可见');
      const desc = el('p', '吉祥物达到 4 级即可解锁攻击，每升一级伤害加成+10！对决伤害全员实时同步。', 'small-note');
      head.append(title, desc);
      const list = el('div', undefined, 'battle-broadcast-list');
      list.id = 'mascot-battle-broadcast-list';
      broadcastSection.append(head, list);

      const targetBefore = petsPanel.querySelector('.pet-day-banner') || petsPanel.firstChild;
      if (targetBefore && targetBefore.nextSibling) {
        petsPanel.insertBefore(broadcastSection, targetBefore.nextSibling);
      } else {
        petsPanel.prepend(broadcastSection);
      }
    }

    const list = $('#mascot-battle-broadcast-list');
    if (!list) return;

    if (!logs || !logs.length) {
      list.replaceChildren(el('div', '暂无战斗对决记录。吉祥物达到 4 级后，输入密码即可发动攻击！', 'battle-empty-note'));
      return;
    }

    list.replaceChildren(...logs.slice(0, 10).map(entry => {
      const item = el('div', undefined, 'battle-log-item' + (entry.levelDropped ? ' level-drop' : ''));
      const time = el('span', entry.time || '', 'battle-log-time');
      const content = el('div', undefined, 'battle-log-content');
      
      const badgeAttacker = el('span', `${entry.attackerName} (Lv.${entry.attackerLevel})`, 'battle-badge attacker');
      const vsSpan = el('span', ' 释放【' + (entry.skillName || '终极一击') + '】 ⚔️ ');
      const badgeTarget = el('span', `${entry.targetName}`, 'battle-badge target');
      const dmgSpan = el('strong', ` -${entry.damage} HP 💥`, 'battle-log-damage');
      dmgSpan.title = `基础伤害 ${entry.baseDamage || 25} + Lv.${entry.attackerLevel}升阶加成 ${entry.levelBonus || 0} HP`;
      
      const detailP = el('p', undefined, 'battle-log-detail');
      detailP.append(badgeAttacker, vsSpan, badgeTarget, dmgSpan);

      const statusSpan = el('span', entry.levelDropped 
        ? ` ⚠️ 目标累计受击3次已降级为 Lv.${entry.targetLevel}！需投票升回！`
        : ` (目标剩余 ${entry.targetHp} HP)`
      , entry.levelDropped ? 'battle-drop-warn' : 'battle-hp-status');

      detailP.append(statusSpan);
      content.append(detailP);
      item.append(time, content);
      return item;
    }));
  }

  // 3. Attack Modal
  let activeModal = null;
  function openAttackModal(attackerPet, allPets) {
    if (activeModal) activeModal.remove();

    const overlay = el('div', undefined, 'attack-modal-overlay');
    const box = el('div', undefined, 'attack-modal-box');

    const h3 = el('h3', `⚔️ 释放【${attackerPet.skillName || '专属攻击'}】`);
    const leftAttacks = attackerPet.remainingAttacks != null ? attackerPet.remainingAttacks : 3;
    const hint = el('p', `攻击方：${attackerPet.name}（Lv.${attackerPet.level} 战斗姿态） · 今日剩余攻击机会：${leftAttacks}/3 次 · 攻击伤害：💥 ${attackerPet.skillDamage || 25} HP（Lv.4 解锁，每升一级伤害加成+10）`, 'small-note');
    const secureHint = el('p', '🛡️ 为防止他人滥用或冒用攻击，请输入管理员设置的授权密码。', 'small-note');
    secureHint.style.color = '#e67e22';

    // Target Selection
    const targetLabel = el('label', '选择攻击目标：');
    const targetSelect = el('select');
    allPets.filter(p => p.id !== attackerPet.id).forEach(p => {
      const opt = el('option', `${p.name} (当前精力：${getMascotHp(p.id)} HP · 累计受击 ${p.hitsReceived || 0}/3 次)`);
      opt.value = p.id;
      targetSelect.append(opt);
    });
    targetLabel.append(targetSelect);

    // Password input
    const pwdLabel = el('label', '输入攻击授权密码：');
    const pwdInput = el('input');
    pwdInput.type = 'password';
    pwdInput.placeholder = '请输入该吉祥物的专属密码（默认 2501）';
    pwdInput.maxLength = 32;
    pwdLabel.append(pwdInput);

    // Error text
    const errText = el('p', '', 'error-text');

    // Actions
    const actions = el('div', undefined, 'attack-modal-actions');
    const cancelBtn = el('button', '取消', 'button secondary');
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      activeModal = null;
    });

    const submitBtn = el('button', '确认发动攻击 ⚡', 'button');
    submitBtn.type = 'button';
    submitBtn.addEventListener('click', async () => {
      const pwd = pwdInput.value.trim();
      if (!pwd) {
        errText.textContent = '请输入攻击授权密码！';
        pwdInput.focus();
        return;
      }
      submitBtn.disabled = true;
      cancelBtn.disabled = true;
      errText.textContent = '正在核对密码并执行攻击…';

      try {
        const res = await fetch('/api/arcade/attack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            attackerId: attackerPet.id,
            targetId: targetSelect.value,
            password: pwd
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || '攻击失败');
        }

        // Success!
        playThunderSound();
        overlay.remove();
        activeModal = null;

        // Apply new HPs
        if (data.hps) {
          const map = getHpMap();
          Object.assign(map, data.hps);
          localStorage.setItem(HP_KEY, JSON.stringify(map));
          Object.keys(map).forEach(id => updateHpUi(id));
        } else {
          setMascotHp(data.targetId, data.targetHp);
        }

        // Animate target
        const targetCard = document.querySelector(`.arcade-pet-card[data-arcade-pet="${data.targetId}"]`);
        if (targetCard) {
          showDmgPop(targetCard, `-${data.damage} HP 💥 【${data.skill}】`);
          targetCard.classList.add('pet-stunned');
          setTimeout(() => targetCard.classList.remove('pet-stunned'), 2400);
        }

        // Animate attacker
        const attackerCard = document.querySelector(`.arcade-pet-card[data-arcade-pet="${data.attackerId}"]`);
        if (attackerCard) {
          attackerCard.classList.add('pet-feed-pop');
          setTimeout(() => attackerCard.classList.remove('pet-feed-pop'), 900);
        }

        if (data.levelDropped) {
          playThunderSound();
          if (targetCard) {
            showDmgPop(targetCard, '⚠️ 连续受击3次，等级-1！快给它投票！');
            targetCard.classList.add('pet-stunned');
            setTimeout(() => targetCard.classList.remove('pet-stunned'), 2800);
          }
        }

        const statusEl = $('#arcade-status');
        if (statusEl) {
          statusEl.textContent = data.log || `⚔️【${data.attacker}】施展【${data.skill}】！击中【${data.target}】，扣除 ${data.damage} 点精力！目标剩余 ${data.targetHp} HP。`;
        }

        // 自动触发游乐厅刷新同步最新成长等级与受击次数
        setTimeout(() => {
          document.querySelector('#arcade-refresh')?.click();
        }, 500);
      } catch (err) {
        errText.textContent = `❌ ${err.message}`;
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });

    actions.append(cancelBtn, submitBtn);
    box.append(h3, hint, secureHint, targetLabel, pwdLabel, errText, actions);
    overlay.append(box);
    document.body.append(overlay);
    activeModal = overlay;
    pwdInput.focus();
  }

  // 4. Attach HP bars and attack buttons
  function attachMascotsHpAndBattle() {
    const cards = document.querySelectorAll('.arcade-pet-card[data-arcade-pet]');
    if (!cards.length) return;

    // Gather pet metadata
    const petsMeta = Array.from(cards).map(card => {
      const id = card.dataset.arcadePet;
      const level = parseInt(card.dataset.petLevel || '1', 10);
      const isMaxLevel = card.dataset.isMaxLevel === 'true' || level >= 6;
      const canAttack = card.dataset.canAttack === 'true' || level >= 4;
      const name = card.querySelector('h4')?.textContent?.split(' ')[0] || id;
      const skillName = card.dataset.skillName || '专属攻击';
      const skillDesc = card.dataset.skillDesc || '';
      const skillDamage = parseInt(card.dataset.skillDamage || '25', 10);
      const remainingAttacks = parseInt(card.dataset.remainingAttacks != null ? card.dataset.remainingAttacks : '3', 10);
      const todayAttacks = parseInt(card.dataset.todayAttacks || '0', 10);
      const hitsReceived = parseInt(card.dataset.hitsReceived || '0', 10);
      const hitsNeeded = parseInt(card.dataset.hitsNeeded || '3', 10);
      return { id, isMaxLevel, canAttack, level, name, skillName, skillDesc, skillDamage, remainingAttacks, todayAttacks, hitsReceived, hitsNeeded, card };
    });

    petsMeta.forEach(pet => {
      const { card, id, isMaxLevel, canAttack, level, skillName, skillDamage, remainingAttacks, todayAttacks } = pet;

      // 1. HP Bar
      if (!card.querySelector('.pet-hp-bar-wrap')) {
        const hp = getMascotHp(id);
        const hpWrap = el('div', undefined, 'pet-hp-bar-wrap');
        const label = el('span', '精力', 'pet-hp-label');
        const bar = el('div', undefined, 'pet-hp-bar');
        const fill = el('div', undefined, 'pet-hp-bar-fill' + (hp < 30 ? ' low' : hp < 60 ? ' mid' : ''));
        fill.style.width = hp + '%';
        bar.append(fill);
        const count = el('span', hp + ' HP', 'pet-hp-count');
        hpWrap.append(label, bar, count);

        const heading = card.querySelector('h4');
        if (heading && heading.nextSibling) {
          card.insertBefore(hpWrap, heading.nextSibling);
        } else {
          card.append(hpWrap);
        }
      }

      // 2. Feed listener -> +25 HP
      const feedBtn = card.querySelector('.pet-feed');
      if (feedBtn && !feedBtn._hpBound) {
        feedBtn._hpBound = true;
        feedBtn.addEventListener('click', () => {
          setTimeout(() => {
            const newHp = setMascotHp(id, getMascotHp(id) + 25);
            showDmgPop(card, '+25 HP 恢复 💖', true);
          }, 300);
        });
      }

      // 3. Attack Area for EVERY mascot
      let skillArea = card.querySelector('.pet-skill-area');
      if (!skillArea) {
        skillArea = el('div', undefined, 'pet-skill-area');
        card.append(skillArea);
      }

      skillArea.replaceChildren();

      if (canAttack) {
        card.classList.add('pet-max-unlocked');
        const attackBtn = el('button', remainingAttacks > 0 ? `⚔️ 释放【${skillName}】(剩${remainingAttacks}次 · 造成${skillDamage}伤害)` : `⚔️ 今日攻击已达上限 (3/3)`, 'mascot-attack-btn');
        attackBtn.type = 'button';
        attackBtn.disabled = remainingAttacks <= 0;
        attackBtn.title = remainingAttacks > 0
          ? `今日已攻击 ${todayAttacks}/3 次 · 当前等级造成 ${skillDamage} 点伤害（基础25 + 升阶加成${Math.max(0, level - 4) * 10}点）`
          : '每个吉祥物每日限发动 3 次攻击，今日次数已用尽';
        attackBtn.addEventListener('click', e => {
          e.stopPropagation();
          openAttackModal(pet, petsMeta);
        });
        skillArea.append(attackBtn);
      } else {
        card.classList.remove('pet-max-unlocked');
        const lockedBadge = el('div', `🔒 Lv.4 解锁【${skillName}】(当前 Lv.${level} · 还需升 ${4 - level} 级)`, 'mascot-locked-skill');
        skillArea.append(lockedBadge);
      }
    });
  }

  // 5. High school fun section (Wooden fish & test oracle)
  const MERIT_KEY = 'class2501_wooden_fish_merit';
  function getLocalMerit() {
    return parseInt(localStorage.getItem(MERIT_KEY) || '0', 10);
  }
  function addLocalMerit() {
    const val = getLocalMerit() + 1;
    localStorage.setItem(MERIT_KEY, String(val));
    return val;
  }
  const meritBlessings = [
    '功德 +1 🪘',
    '高考 +10 分 💯',
    '圆锥曲线第一问秒杀 +1 📐',
    '文综大题不卡点 +1 📝',
    '理综选择全对 +1 ⚡',
    '头发 +1 💇',
    '代码零 Bug +1 💻',
    '早八不困 +1 ☕',
    '疯狂星期四V我50 +1 🍗',
    '考神附体 +1 👑',
    '英语听力全听懂 +1 🎧',
    '期末排名上升 +1 🚀'
  ];
  const oracleAnswers = [
    '【考场第一定律】：三长一短选最短！这道题选 A，相信直觉稳了！',
    '【考场第二定律】：三短一长选最长！根据几何对称性选 C！',
    '【考场第三定律】：参差不齐选 B！如果做错了，就说是班长给你选的。',
    '【开普勒定律】：此题超纲，建议在答题卡上先写一个“解：”保底得一分。',
    '【数学老师批注】：这道题很显然。显然出题人不想让你得分，先做下一道！',
    '【量子力学解法】：遇事不决，量子力学；逻辑不通，全选 C 冲！',
    '【同桌互补法】：根据能量守恒，你同桌选 A，你选 B，你们俩至少有一个人得分！',
    '【考场第六感】：两长两短就选 D！相信你的第一印象，千万别改，一改必错！',
    '【语文课代表密电】：阅读理解写“表达了作者深沉而复杂的思乡之情”，得分率 90%！'
  ];

  function renderHighSchoolFunSection() {
    const petsPanel = $('#arcade-pets');
    if (!petsPanel || $('#highschool-fun-section')) return;

    const section = el('div', undefined, 'muyu-section');
    section.id = 'highschool-fun-section';

    const eyebrow = el('div', 'CAMPUS STRESS RELIEVER · 课间解压神器', 'eyebrow');
    const title = el('h3', '班级电子木鱼 · 考神附体功德机 🪘');
    const desc = el('p', '敲一次木鱼，功德+1，做题全对！支持鼠标轻点或键盘空格键敲击。', 'small-note');

    const bowl = el('div', '🪘', 'muyu-bowl');
    bowl.setAttribute('role', 'button');
    bowl.setAttribute('tabindex', '0');
    bowl.setAttribute('aria-label', '点击敲木鱼积攒功德');

    const meritNum = el('div', String(getLocalMerit()), 'muyu-merit');
    meritNum.id = 'muyu-merit-count';
    const meritLabel = el('div', '今日我的累计功德点数', 'muyu-merit-label');

    function handleHit(e) {
      if (e) e.preventDefault();
      playMuyuSound();
      const current = addLocalMerit();
      meritNum.textContent = String(current);

      bowl.classList.remove('hit');
      void bowl.offsetWidth;
      bowl.classList.add('hit');

      const rect = bowl.getBoundingClientRect();
      const floater = el('div', meritBlessings[Math.floor(Math.random() * meritBlessings.length)], 'muyu-float');
      floater.style.left = (rect.left + rect.width / 2 - 50 + (Math.random() * 30 - 15)) + 'px';
      floater.style.top = (rect.top - 10) + 'px';
      document.body.append(floater);
      setTimeout(() => floater.remove(), 1300);
    }

    bowl.addEventListener('click', handleHit);
    bowl.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'Enter') handleHit(e);
    });

    const oracleBox = el('div');
    oracleBox.style.marginTop = '24px';
    oracleBox.style.borderTop = '1px dashed var(--line)';
    oracleBox.style.paddingTop = '18px';

    const oracleBtn = el('button', '🎲 考场玄学蒙题器 (遇事不决点这里) ↗', 'kaoshi-oracle-btn');
    oracleBtn.type = 'button';

    const oracleResult = el('div', '点击上方按钮，为你测算今日做题玄学与最佳选项指南 ✦', 'oracle-result');

    oracleBtn.addEventListener('click', () => {
      playBasketballSound();
      oracleResult.style.opacity = '0.3';
      setTimeout(() => {
        const quote = oracleAnswers[Math.floor(Math.random() * oracleAnswers.length)];
        oracleResult.textContent = quote;
        oracleResult.style.opacity = '1';
      }, 150);
    });

    oracleBox.append(oracleBtn, oracleResult);
    section.append(eyebrow, title, desc, bowl, meritNum, meritLabel, oracleBox);

    const stickerAlbum = petsPanel.querySelector('.sticker-album');
    if (stickerAlbum) {
      petsPanel.insertBefore(section, stickerAlbum);
    } else {
      petsPanel.append(section);
    }
  }

  // 6. Init
  function init() {
    syncHpsFromServer();
    attachMascotsHpAndBattle();
    renderHighSchoolFunSection();

    window.addEventListener('class-mascots-rendered', e => {
      attachMascotsHpAndBattle();
      if (e.detail && Array.isArray(e.detail.battleLogs)) {
        renderBattleLogsSection(e.detail.battleLogs);
      }
    });

    setInterval(() => {
      if (!document.hidden) syncHpsFromServer();
    }, 10000);

    const mascotsContainer = $('#arcade-mascots');
    if (mascotsContainer) {
      const observer = new MutationObserver(() => {
        attachMascotsHpAndBattle();
      });
      observer.observe(mascotsContainer, { childList: true });
    }

    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && e.target === document.body) {
        const bowl = $('.muyu-bowl');
        if (bowl && bowl.offsetParent !== null) {
          e.preventDefault();
          bowl.click();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
