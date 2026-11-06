'use strict';
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

  // 3. Attack Modal
  let activeModal = null;
  function openAttackModal(attackerPet, allPets) {
    if (activeModal) activeModal.remove();

    const overlay = el('div', undefined, 'attack-modal-overlay');
    const box = el('div', undefined, 'attack-modal-box');

    const h3 = el('h3', `⚔️ 释放【${attackerPet.skillName || '专属攻击'}】`);
    const hint = el('p', `攻击方：${attackerPet.name}（Lv.${attackerPet.level} 巅峰形态） · 伤害值：${attackerPet.skillDamage || 20} HP`, 'small-note');
    const secureHint = el('p', '🛡️ 为防止他人滥用或冒用攻击，请输入管理员设置的授权密码。', 'small-note');
    secureHint.style.color = '#e67e22';

    // Target Selection
    const targetLabel = el('label', '选择攻击目标：');
    const targetSelect = el('select');
    allPets.filter(p => p.id !== attackerPet.id).forEach(p => {
      const opt = el('option', `${p.name} (当前精力：${getMascotHp(p.id)} HP)`);
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

        const statusEl = $('#arcade-status');
        if (statusEl) {
          statusEl.textContent = `⚔️【${data.attacker}】施展【${data.skill}】！击中【${data.target}】，扣除 ${data.damage} 点精力！目标剩余 ${data.targetHp} HP。`;
        }
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
      const isMaxLevel = card.dataset.isMaxLevel === 'true' || (parseInt(card.dataset.petLevel || '1', 10) >= 6);
      const level = parseInt(card.dataset.petLevel || '1', 10);
      const name = card.querySelector('h4')?.textContent?.split(' ')[0] || id;
      const skillName = card.dataset.skillName || '专属攻击';
      const skillDesc = card.dataset.skillDesc || '';
      const skillDamage = parseInt(card.dataset.skillDamage || '20', 10);
      return { id, isMaxLevel, level, name, skillName, skillDesc, skillDamage, card };
    });

    petsMeta.forEach(pet => {
      const { card, id, isMaxLevel, skillName, skillDamage } = pet;

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

      if (isMaxLevel) {
        card.classList.add('pet-max-unlocked');
        const attackBtn = el('button', `⚔️ 释放【${skillName}】`, 'mascot-attack-btn');
        attackBtn.type = 'button';
        attackBtn.title = `对其他吉祥物造成 ${skillDamage} 点体力伤害（需输入管理密码）`;
        attackBtn.addEventListener('click', e => {
          e.stopPropagation();
          openAttackModal(pet, petsMeta);
        });
        skillArea.append(attackBtn);
      } else {
        card.classList.remove('pet-max-unlocked');
        const lockedBadge = el('div', `🔒 Lv.6 满级解锁【${skillName}】`, 'mascot-locked-skill');
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

    window.addEventListener('class-mascots-rendered', () => {
      attachMascotsHpAndBattle();
    });

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
