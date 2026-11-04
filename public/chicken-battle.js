'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };

  // --------------------------------------------------------------------------
  // 1. Web Audio 合成音效（纯原生，零外部音频资源依赖，即开即响）
  // --------------------------------------------------------------------------
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

  // 木鱼原声合成（清脆厚重“笃”声）
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

  // 篮球弹跳音效（空心入网与反弹“砰”）
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

  // 铁山靠与只因天雷暴击音效（轰鸣撞击）
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

  // --------------------------------------------------------------------------
  // 2. 吉祥物血量 HP 系统 (本地与互动实时计算)
  // --------------------------------------------------------------------------
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

  function showDmgPop(targetEl, text, isHeal = false) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const pop = el('div', text, 'dmg-pop' + (isHeal ? ' heal' : ''));
    pop.style.left = (rect.left + rect.width / 2 - 40 + (Math.random() * 20 - 10)) + 'px';
    pop.style.top = (rect.top + 20) + 'px';
    document.body.append(pop);
    setTimeout(() => pop.remove(), 1200);
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

  // --------------------------------------------------------------------------
  // 3. 鸡专属攻击系统与技能触发
  // --------------------------------------------------------------------------
  let pendingSkill = null; // 'basketball' | 'iron_shoulder' | 'thunder'

  function attachMascotsHpAndBattle() {
    const cards = document.querySelectorAll('.arcade-pet-card[data-arcade-pet]');
    if (!cards.length) return;

    cards.forEach(card => {
      const id = card.dataset.arcadePet;
      if (!id) return;

      // 1. 注入血条（若未注入）
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

        // 插入在吉祥物名与性格描述之间
        const heading = card.querySelector('h4');
        if (heading && heading.nextSibling) {
          card.insertBefore(hpWrap, heading.nextSibling);
        } else {
          card.append(hpWrap);
        }
      }

      // 2. 监听投喂按钮：投喂时回血 +25 HP
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

      // 3. 点击被选中的目标卡片（当鸡准备攻击时）
      if (!card._attackTargetBound) {
        card._attackTargetBound = true;
        card.addEventListener('click', e => {
          if (!pendingSkill) return;
          if (id === 'chicken') {
            alert('不能攻击自己哦！请点击其他吉祥物作为攻击目标 🎯');
            return;
          }
          executeSkillAttack(id, pendingSkill);
          pendingSkill = null;
          updateSkillButtonsState();
        });
      }

      // 4. 为“鸡”专属注入战斗技能栏
      if (id === 'chicken' && !card.querySelector('.chicken-attack-btns')) {
        const levelText = card.querySelector('.pet-level')?.textContent || 'Lv.1';
        const match = levelText.match(/Lv\.(\d+)/);
        const level = match ? parseInt(match[1], 10) : 1;

        if (level >= 3) {
          card.classList.add('chicken-ultimate');
        }

        const btnWrap = el('div', undefined, 'chicken-attack-btns');

        // 技能 1: 单手投篮
        const btn1 = el('button', '🏀 单手投篮 (-15 HP)', 'chicken-skill-btn basic');
        btn1.type = 'button';
        btn1.title = '普攻：点击后点击任一吉祥物投掷篮球';
        btn1.addEventListener('click', e => {
          e.stopPropagation();
          setOrTriggerSkill('basketball', btn1);
        });

        // 技能 2: 铁山靠 (Lv.2 解锁)
        const btn2 = el('button', level >= 2 ? '💥 铁山靠 (-30 HP)' : '🔒 铁山靠 (需鸡 Lv.2 解锁)', 'chicken-skill-btn charge');
        btn2.type = 'button';
        btn2.disabled = level < 2;
        btn2.title = level >= 2 ? '进阶暴击：强力冲撞并使目标眩晕旋转' : '每投喂 10 次升级变身后解锁';
        btn2.addEventListener('click', e => {
          e.stopPropagation();
          setOrTriggerSkill('iron_shoulder', btn2);
        });

        // 技能 3: 只因天雷全场 AOE (Lv.3 解锁)
        const btn3 = el('button', level >= 3 ? '⚡ 只因天雷 (全场AOE)' : '🔒 只因天雷 (需鸡 Lv.3 解锁)', 'chicken-skill-btn aoe');
        btn3.type = 'button';
        btn3.disabled = level < 3;
        btn3.title = level >= 3 ? '终极奥义：全场所有吉祥物同时遭受天雷与音乐暴击' : '进化至唱跳霸王鸡解锁';
        btn3.addEventListener('click', e => {
          e.stopPropagation();
          executeAoeThunder();
        });

        const hint = el('div', '💡 提示：点击技能后，点击任一吉祥物即可造成伤害！', 'skill-cooldown');

        btnWrap.append(btn1, btn2, btn3, hint);
        card.append(btnWrap);
      }
    });
  }

  function setOrTriggerSkill(skillType, btn) {
    if (pendingSkill === skillType) {
      pendingSkill = null;
      updateSkillButtonsState();
      return;
    }
    pendingSkill = skillType;
    updateSkillButtonsState();

    const statusEl = $('#arcade-status');
    if (statusEl) {
      statusEl.textContent = '🎯 已装填技能！请点击上方任意一只其他吉祥物发动攻击（或 4 秒后自动随机攻击目标）~';
    }

    clearTimeout(window._autoAttackTimer);
    window._autoAttackTimer = setTimeout(() => {
      if (pendingSkill === skillType) {
        // 自动选择一只非鸡的吉祥物
        const targets = Array.from(document.querySelectorAll('.arcade-pet-card[data-arcade-pet]'))
          .map(c => c.dataset.arcadePet)
          .filter(id => id && id !== 'chicken');
        if (targets.length) {
          const rand = targets[Math.floor(Math.random() * targets.length)];
          executeSkillAttack(rand, skillType);
        }
        pendingSkill = null;
        updateSkillButtonsState();
      }
    }, 4000);
  }

  function updateSkillButtonsState() {
    document.querySelectorAll('.chicken-skill-btn').forEach(b => {
      b.style.outline = '';
    });
    if (pendingSkill) {
      const activeBtn = document.querySelector(`.chicken-skill-btn.${pendingSkill === 'basketball' ? 'basic' : 'charge'}`);
      if (activeBtn) activeBtn.style.outline = '3px solid #ff4757';
    }
  }

  function executeSkillAttack(targetId, skill) {
    const targetCard = document.querySelector(`.arcade-pet-card[data-arcade-pet="${targetId}"]`);
    if (!targetCard) return;

    if (skill === 'basketball') {
      playBasketballSound();
      const current = getMascotHp(targetId);
      const newHp = setMascotHp(targetId, current - 15);
      showDmgPop(targetCard, '-15 HP 🏀 投篮命中！');

      targetCard.classList.add('pet-feed-pop');
      setTimeout(() => targetCard.classList.remove('pet-feed-pop'), 600);

      const statusEl = $('#arcade-status');
      if (statusEl) {
        statusEl.textContent = `🏀 鸡对 ${targetCard.querySelector('h4')?.textContent || targetId} 投出了一记三分球，造成 15 点伤害！剩余 ${newHp} HP`;
      }
    } else if (skill === 'iron_shoulder') {
      playThunderSound();
      const current = getMascotHp(targetId);
      const newHp = setMascotHp(targetId, current - 30);
      showDmgPop(targetCard, '-30 HP 💥 铁山靠暴击！');

      targetCard.classList.add('pet-stunned');
      setTimeout(() => targetCard.classList.remove('pet-stunned'), 2400);

      // 弹出受击吐槽气泡
      const quotes = [
        '你干嘛~~哈哈哎哟！😵',
        '露出小黑脚了是吧！💫',
        '巅峰产生虚伪的拥护！💥',
        '哎哟你这大招有点痛！🤕'
      ];
      showDmgPop(targetCard, quotes[Math.floor(Math.random() * quotes.length)]);

      const statusEl = $('#arcade-status');
      if (statusEl) {
        statusEl.textContent = `💥 铁山靠冲撞！${targetCard.querySelector('h4')?.textContent || targetId} 原地眩晕旋转，扣除 30 点体力！剩余 ${newHp} HP`;
      }
    }
  }

  function executeAoeThunder() {
    playThunderSound();
    const statusEl = $('#arcade-status');
    if (statusEl) {
      statusEl.textContent = '⚡【只因天雷 · 鸡你太美】全场终极奥义爆发！所有吉祥物集体受击掉血！';
    }

    const cards = document.querySelectorAll('.arcade-pet-card[data-arcade-pet]');
    cards.forEach(card => {
      const id = card.dataset.arcadePet;
      if (id && id !== 'chicken') {
        const cur = getMascotHp(id);
        setMascotHp(id, cur - 12);
        showDmgPop(card, '-12 HP ⚡');
        card.classList.add('pet-feed-pop');
        setTimeout(() => card.classList.remove('pet-feed-pop'), 700);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. 高中生爆梗模块：【班级电子木鱼】 & 【考场玄学蒙题神器】
  // --------------------------------------------------------------------------
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

    // 标题
    const eyebrow = el('div', 'CAMPUS STRESS RELIEVER · 课间解压神器', 'eyebrow');
    const title = el('h3', '班级电子木鱼 · 考神附体功德机 🪘');
    const desc = el('p', '敲一次木鱼，功德+1，做题全对！支持鼠标轻点或键盘空格键敲击。', 'small-note');

    // 木鱼主体
    const bowl = el('div', '🪘', 'muyu-bowl');
    bowl.setAttribute('role', 'button');
    bowl.setAttribute('tabindex', '0');
    bowl.setAttribute('aria-label', '点击敲木鱼积攒功德');

    const meritNum = el('div', String(getLocalMerit()), 'muyu-merit');
    meritNum.id = 'muyu-merit-count';
    const meritLabel = el('div', '今日我的累计功德点数', 'muyu-merit-label');

    // 敲击动作处理
    function handleHit(e) {
      if (e) e.preventDefault();
      playMuyuSound();
      const current = addLocalMerit();
      meritNum.textContent = String(current);

      bowl.classList.remove('hit');
      void bowl.offsetWidth; // trigger reflow
      bowl.classList.add('hit');

      // 飘字动画
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

    // 玄学蒙题神器部分
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

    // 插入在吉祥物展示区与贴纸相册之间
    const stickerAlbum = petsPanel.querySelector('.sticker-album');
    if (stickerAlbum) {
      petsPanel.insertBefore(section, stickerAlbum);
    } else {
      petsPanel.append(section);
    }
  }

  // --------------------------------------------------------------------------
  // 5. 初始化与周期检测
  // --------------------------------------------------------------------------
  function init() {
    attachMascotsHpAndBattle();
    renderHighSchoolFunSection();

    // 监听 DOM 变化（当同学切换标签或刷新游乐厅时动态重新挂载）
    const mascotsContainer = $('#arcade-mascots');
    if (mascotsContainer) {
      const observer = new MutationObserver(() => {
        attachMascotsHpAndBattle();
      });
      observer.observe(mascotsContainer, { childList: true });
    }

    // 快捷键支持：当在游乐厅面板时按空格键也能敲木鱼
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
