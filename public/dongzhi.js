'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // --------------------------------------------------------------------------
  // 1. 页面滚动进度条
  // --------------------------------------------------------------------------
  function initProgressBar() {
    const bar = $('#reading-progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 2. 纯 Web Audio API 炉火噼啪与水沸白噪音 (不自动播放，尊重用户选择并保存会话)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let isAudioPlaying = false;
  let noiseNode = null;
  let gainNode = null;
  let crackleInterval = null;

  function initAudio() {
    // 检查 sessionStorage 中的偏好状态
    const saved = sessionStorage.getItem('solstice_audio_enabled');
    if (saved === '1') {
      // 浏览器策略不允许未经交互直接自动出声，用户点击任意键或按钮后即可触发
      const promptResume = () => {
        toggleWarmAudio(true);
        window.removeEventListener('click', promptResume);
      };
      window.addEventListener('click', promptResume, { once: true });
    }

    $('#audio-toggle-btn')?.addEventListener('click', () => toggleWarmAudio());
  }

  function toggleWarmAudio(forceStart = false) {
    if (!isAudioPlaying || forceStart) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        // 持续温和低频白噪音模拟温暖水沸与室内微光
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 1.4;
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, audioCtx.currentTime);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start();

        // 随机木柴噼啪爆裂
        crackleInterval = setInterval(() => {
          if (!isAudioPlaying || !audioCtx) return;
          if (Math.random() < 0.6) playCracklePop();
        }, 360);

        isAudioPlaying = true;
        sessionStorage.setItem('solstice_audio_enabled', '1');
        $('#audio-toggle-btn')?.classList.add('active');
        const txt = $('#audio-status-text');
        if (txt) txt.textContent = '[开]';
      } catch (e) {
        console.warn('Audio start failed:', e);
      }
    } else {
      stopWarmAudio();
    }
  }

  function stopWarmAudio() {
    isAudioPlaying = false;
    sessionStorage.setItem('solstice_audio_enabled', '0');
    if (crackleInterval) clearInterval(crackleInterval);
    if (noiseNode) {
      try { noiseNode.stop(); } catch {}
      noiseNode = null;
    }
    $('#audio-toggle-btn')?.classList.remove('active');
    const txt = $('#audio-status-text');
    if (txt) txt.textContent = '[关]';
  }

  function playCracklePop() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 + Math.random() * 380, audioCtx.currentTime);
    g.gain.setValueAtTime(0.025, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  }

  function playFeedbackBlip(pitch = 520) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx && AudioContext) audioCtx = new AudioContext();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, audioCtx.currentTime + 0.12);
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}
  }

  // --------------------------------------------------------------------------
  // 3. 今晚自毁倒计时
  // --------------------------------------------------------------------------
  let expireTimestamp = new Date('2026-11-08T00:00:00+08:00').getTime();

  function updateCountdown() {
    const now = Date.now();
    const diff = expireTimestamp - now;

    if (diff <= 0) {
      $('#cd-hours').textContent = '00';
      $('#cd-mins').textContent = '00';
      $('#cd-secs').textContent = '00';
      triggerSelfDestruct();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    $('#cd-hours').textContent = String(hours).padStart(2, '0');
    $('#cd-mins').textContent = String(mins).padStart(2, '0');
    $('#cd-secs').textContent = String(secs).padStart(2, '0');
  }

  function triggerSelfDestruct() {
    const modal = $('#destruct-fullscreen-modal');
    if (modal) modal.style.display = 'flex';
    setTimeout(() => {
      window.location.href = '/';
    }, 6000);
  }

  // --------------------------------------------------------------------------
  // 4. 饺子 VS 汤圆俱乐部数据与真实投票交互
  // --------------------------------------------------------------------------
  async function loadSolsticeState() {
    try {
      const res = await fetch('/api/solstice/state');
      if (res.status === 410 || res.status === 404) {
        triggerSelfDestruct();
        return;
      }
      const data = await res.json();
      if (data.expireAt) expireTimestamp = data.expireAt;
      updateBattleUI(data.votes);
      renderWishes(data.wishes);
    } catch (e) {
      console.warn('Load state err:', e);
    }
  }

  function updateBattleUI(votes) {
    if (!votes) return;
    const dCount = votes.dumpling || 0;
    const tCount = votes.tangyuan || 0;
    const total = dCount + tCount;

    $('#dumpling-vote-count').textContent = dCount;
    $('#tangyuan-vote-count').textContent = tCount;
    $('#total-vote-tally').textContent = total;

    const dPct = total > 0 ? Math.round((dCount / total) * 100) : 50;
    const tPct = 100 - dPct;

    $('#pk-bar-dumpling').style.width = `${dPct}%`;
    $('#pk-bar-tangyuan').style.width = `${tPct}%`;
    $('#dumpling-percent-text').textContent = `${dPct}%`;
    $('#tangyuan-percent-text').textContent = `${tPct}%`;

    const leadBadge = $('#metrics-lead-badge');
    if (dCount > tCount) {
      leadBadge.textContent = 'DUMPLING CLUB LEADING 🥟';
    } else if (tCount > dCount) {
      leadBadge.textContent = 'TANGYUAN CLUB LEADING 🍡';
    } else {
      leadBadge.textContent = 'DEAD HEAT // 势均力敌';
    }

    const dCard = $('#club-dumpling-card');
    const tCard = $('#club-tangyuan-card');
    const dBtn = $('#vote-dumpling-btn');
    const tBtn = $('#vote-tangyuan-btn');
    const statusMsg = $('#pk-my-status');

    dCard.classList.toggle('voted-active', votes.myVote === 'dumpling');
    tCard.classList.toggle('voted-active', votes.myVote === 'tangyuan');
    dBtn.classList.toggle('is-active-vote', votes.myVote === 'dumpling');
    tBtn.classList.toggle('is-active-vote', votes.myVote === 'tangyuan');

    if (votes.myVote === 'dumpling') {
      statusMsg.innerHTML = '✔ 你已为 <strong>北方饺子俱乐部 (DUMPLING CLUB)</strong> 投出一票！';
    } else if (votes.myVote === 'tangyuan') {
      statusMsg.innerHTML = '✔ 你已为 <strong>南方汤圆俱乐部 (TANGYUAN CLUB)</strong> 投出一票！';
    } else {
      statusMsg.textContent = '点击上方俱乐部按钮，投下你在 25 计 1 的真实专属票！';
    }
  }

  async function voteCamp(choice) {
    playFeedbackBlip(600);
    try {
      const res = await fetch('/api/solstice/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice })
      });
      if (res.status === 410) {
        triggerSelfDestruct();
        return;
      }
      const data = await res.json();
      updateBattleUI(data.votes);
    } catch {
      alert('网络连接未响应，请稍后重试');
    }
  }

  // --------------------------------------------------------------------------
  // 5. 14 位官方吉祥物真实图鉴 (CLASS 25 CHARACTER ARCHIVE)
  // --------------------------------------------------------------------------
  const mascotArchiveData = [
    {
      id: 'shoe',
      num: '01',
      name: '鞋子',
      emoji: '👟',
      trait: '狂暴跑者',
      skill: '黄金切尔西破颜踢',
      damage: 'Lv.4 造成 35 点破颜暴击伤害，每升一级伤害递增。',
      quote: '英雄可以受委屈，但不能踩我的切尔西！今天冬至不踢人，送大家纯棉暖宝宝！',
      lore: '步履不停，踏碎一切困难。在班级里守护每一位早八赶课的同学，从不迟到。',
      secret: '🥾 黄金切尔西极速充能完毕！早八冲刺速度 +100%！'
    },
    {
      id: 'oil',
      num: '02',
      name: '油',
      emoji: '🛢️',
      trait: '高能推力',
      skill: '烈焰机油大爆燃',
      damage: 'Lv.4 倾倒高能航空机油引燃烈焰，造成 35 点炽热爆燃伤害。',
      quote: '全宇宙的核心动力源泉！今晚热油专炸黄金酥肉，给25计1全员加餐！',
      lore: '全员加满油，一路顺滑飙到底。润滑每一个卡死的编译器，让代码飞速狂飙。',
      secret: '🔥 航空燃油注入！代码执行延迟降为 0ms！'
    },
    {
      id: 'liubang',
      num: '03',
      name: '刘邦',
      emoji: '👑',
      img: '/assets/liubang-1.jpg',
      trait: '汉高祖神尊',
      skill: '赤霄神剑斩白蛇',
      damage: 'Lv.4 拔出三尺赤霄神剑，造成 40 点帝王至尊伤害。',
      quote: '今天不斩白蛇只剥红薯！大风起兮云飞扬，吃饱期末不慌张！',
      lore: '泗水亭长威加海内！拥有五款王者神装立绘随等级解锁，护佑全班威震四海。',
      secret: '⚔️ 汉王神装切换！“安得猛士兮守四方，高数期末通通及格！”'
    },
    {
      id: 'toe',
      num: '04',
      name: '脚趾头',
      emoji: '🦶',
      trait: '破防狂战士',
      skill: '抠出三室一厅',
      damage: 'Lv.4 当场脚趾抠地抠出三室一厅，造成 25 点绝对破防伤害。',
      quote: '穿上防冻小棉套啦！就算当场抠出三室一厅，也是温暖的地暖豪宅！',
      lore: '白白嫩嫩，迈出探索世界第一步。尴尬力爆棚时当场抠出一座紫禁城。',
      secret: '🏰 豪华精装地暖三室一厅拔地而起！全班拎包入住！'
    },
    {
      id: 'arowana',
      num: '05',
      name: '龙鱼',
      emoji: '🐠',
      trait: '祥瑞锦鲤',
      skill: '金龙摆尾翻江浪',
      damage: 'Lv.4 巨尾拍出千层惊涛骇浪，造成 25 点祥瑞水瀑伤害。',
      quote: '鱼跃龙门，身聚万千气运！考前拜龙鱼，高数离散全通过！',
      lore: '金鳞耀目，灵动游弋。传说在它身边写代码的同学，运行一次就能AC通过。',
      secret: '✨ 龙鱼赐福金光普照！期末考卷全中重点！'
    },
    {
      id: 'squirtle',
      num: '06',
      name: '杰尼龟',
      emoji: '🐢',
      trait: '水系霸主',
      skill: '水炮墨镜铁头功',
      damage: 'Lv.4 射出超高压水炮与铁头撞击，造成 25 点硬核水系伤害。',
      quote: '杰尼军团红围巾已戴好！背负双联高压水炮，今晚喷出的全是热奶茶！',
      lore: '圆圆脑袋，杰尼杰尼~ 戴上黑色墨镜时霸气外露，冬天最喜欢缩在被窝里。',
      secret: '🕶️ 杰尼军团墨镜登场！热奶茶水炮已发射！'
    },
    {
      id: 'buckteeth',
      num: '07',
      name: '兔子牙',
      emoji: '🦷',
      trait: '坚果粉碎机',
      skill: '暴风超能大门牙',
      damage: 'Lv.4 门牙闪电连环狂啃，造成 25 点疯狂破壳伤害。',
      quote: '咔嚓咔嚓连环啃大冻梨！冰凉爽脆，大门牙吃嘛嘛香，坚果钢板照啃不误！',
      lore: '两颗闪闪发光的大门牙，萌翻全场。不管是东北冻梨还是硬核汇编都能啃下。',
      secret: '🍐 嘎嘣脆！大门牙一秒解决掉一盘冰梨！'
    },
    {
      id: 'rednose',
      num: '08',
      name: '小丑先生',
      emoji: '👦',
      img: '/assets/rednose-classmate.svg',
      trait: '欢笑守护神',
      skill: '奇迹魔术大爆炸',
      damage: 'Lv.4 掷出礼帽引爆漫天彩带与白鸽，造成 30 点浪漫暴击。',
      quote: '虽然鼻子天生红，但心里热乎乎的！愿青春永不谢幕，同窗一起大笑！',
      lore: '鼻尖一点红，同窗一起笑。礼帽变白鸽，欢笑洒满堂，带来奇迹与浪漫。',
      secret: '🎩 礼帽翻飞！变出漫天暖心冬至糖果！'
    },
    {
      id: 'cat',
      num: '09',
      name: '野猫',
      emoji: '🐈',
      trait: '幽冥夜影',
      skill: '绝影幻影九连爪',
      damage: 'Lv.4 化身鬼魅残影挥出猫猫利爪，造成 30 点迅捷抓挠伤害。',
      quote: '喵呜~ 趴在暖气片上，肚皮烤得热烘烘！Debug抓虫如捕鼠，一爪一个！',
      lore: '自由探索，好奇不打烊。巡视校园，踏风而行，冬至最大的追求是暖气片。',
      secret: '🐾 赏你一个热气腾腾的粉嫩肉垫印章！'
    },
    {
      id: 'pig',
      num: '10',
      name: '猪',
      emoji: '🐷',
      trait: '创世神猪',
      skill: '神猪天降重压',
      damage: 'Lv.4 肥美神猪从天而降，造成 30 点暴击重压伤害。',
      quote: '全班顶流金猪！泥坑结冰了今晚抱大饺子，肥美神猪从天而降送好运！',
      lore: '快乐加倍，烦恼减半。身披金光插上梦想翅膀，给全班降下无尽祥瑞。',
      secret: '🥓 黄金脆皮香气四溢！全班食欲大开！'
    },
    {
      id: 'wuba',
      num: '11',
      name: '胡巴',
      emoji: '🌱',
      trait: '妖界至尊',
      skill: '万妖怒涛水龙卷',
      damage: 'Lv.4 小嘴一鼓喷射超高压水龙卷，造成 30 点萌妖水系暴击。',
      quote: '即使是数九寒冬，也在努力破土生长！神仙胡巴法力无边佑全班！',
      lore: '刚破土而出的青嫩小萝卜头，摇头晃脑。万灵俯首，号令四海八荒萌妖。',
      secret: '👶 Wuba Wuba~ 吐出一大串晶莹泡泡！'
    },
    {
      id: 'triangle',
      num: '12',
      name: '三角形',
      emoji: '📐',
      trait: '几何美学',
      skill: '次元三棱绝对切割',
      damage: 'Lv.4 调动几何公理与三棱晶体光速切割，造成 35 点绝对真实伤害。',
      quote: '锐角尖尖，棱角分明！百慕大神秘力场，吸走期末所有Bug与烦恼！',
      lore: '三点成面最稳固，几何美学天花板。数学与宇宙的终极真理，构筑永恒基石。',
      secret: '🌈 三棱镜折射！七彩光谱照亮未来前程！'
    },
    {
      id: 'beetle',
      num: '13',
      name: '屎壳郎',
      emoji: '🪲',
      trait: '毅力之王',
      skill: '创世神球陨石坠',
      damage: 'Lv.4 推起星核陨石从太空砸下，造成 35 点震撼天地的冲击伤害。',
      quote: '推起星辰大海，宇宙皆为掌中球！默默蓄力，终将推动初升骄阳！',
      lore: '勤劳推球，默默蓄力不言弃。推动宇宙大爆炸的核心原点，点亮不朽文明。',
      secret: '🪐 推动一颗发光星辰，宇宙尽在手中！'
    },
    {
      id: 'dog',
      num: '14',
      name: '狗',
      emoji: '🐶',
      trait: '元气守护者',
      skill: '天狗啸月破空咬',
      damage: 'Lv.4 引动神力狂暴扑咬，造成 30 点忠诚守护伤害。',
      quote: '汪汪汪！戴好雷锋帽，风雨无阻守护全班，给敲代码敲累的同学暖爪爪！',
      lore: '一路相伴，快乐有同伙。风雨无阻护卫 25 计 1 班，同窗义气拉满。',
      secret: '🐕 热情摇尾巴！递上一大杯暖手热可可！'
    }
  ];

  let currentDossierIndex = 0;

  function renderMascotArchive() {
    const grid = $('#mascot-archive-grid');
    if (!grid) return;

    grid.innerHTML = mascotArchiveData.map((m, idx) => {
      const avatarHtml = m.img
        ? `<img class="avatar-graphic-img" src="${m.img}" alt="${m.name}" loading="lazy">`
        : `<span class="avatar-graphic-emoji">${m.emoji}</span>`;

      return `
        <article class="archive-character-card" data-idx="${idx}" tabindex="0" role="button" aria-label="查看 ${m.name} 档案">
          <span class="card-index-pill">NO.${m.num}</span>
          <div class="card-avatar-stage">
            ${avatarHtml}
          </div>
          <h4 class="card-character-name">${m.name}</h4>
          <span class="card-role-trait">${m.trait}</span>
          <span class="card-inspect-cta">VIEW DOSSIER ➔</span>
        </article>
      `;
    }).join('');

    $$('.archive-character-card').forEach(card => {
      card.addEventListener('click', () => {
        openMascotDossier(Number(card.dataset.idx));
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMascotDossier(Number(card.dataset.idx));
        }
      });
    });
  }

  function openMascotDossier(index) {
    currentDossierIndex = (index + mascotArchiveData.length) % mascotArchiveData.length;
    const m = mascotArchiveData[currentDossierIndex];
    playFeedbackBlip(680);

    $('#dossier-id-tag').textContent = `#${m.num}`;
    $('#dossier-name-text').textContent = m.name;
    $('#dossier-trait-text').textContent = m.trait;
    $('#dossier-skill-text').textContent = m.skill;
    $('#dossier-quote-text').textContent = `“${m.quote}”`;
    $('#dossier-lore-text').textContent = m.lore;
    $('#dossier-damage-text').textContent = m.damage;

    const avatarBox = $('#dossier-avatar-container');
    if (m.img) {
      avatarBox.innerHTML = `<img src="${m.img}" alt="${m.name}">`;
    } else {
      avatarBox.innerHTML = `<span class="large-emoji">${m.emoji}</span>`;
    }

    const overlay = $('#dossier-modal-overlay');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeMascotDossier() {
    const overlay = $('#dossier-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // --------------------------------------------------------------------------
  // 6. 冬日幸运签抽签机 (WINTER FORTUNE MACHINE)
  // --------------------------------------------------------------------------
  const fortuneSlipsData = [
    {
      serial: 'NO. 2501-A',
      name: '韭菜鸡蛋水饺 · 编译零Bug符',
      quote: '“编译一次通过，高数90+，期末大作业答辩全场鼓掌！”',
      mascot: '鞋子',
      code: 'exit(0); // 顺畅如飞'
    },
    {
      serial: 'NO. 2501-B',
      name: '黑芝麻爆浆汤圆 · 高甜充能符',
      quote: '“今晚枕头格外软，早八有人帮忙占前排好位，精神饱满！”',
      mascot: '龙鱼',
      code: 'sleep_hours >= 8.0'
    },
    {
      serial: 'NO. 2501-C',
      name: '鲜虾玉米水饺 · 锦鲤附体符',
      quote: '“抢选修课秒进心仪课，抽卡次次保底提前出金，生活处处有惊喜！”',
      mascot: '刘邦',
      code: 'fortune.boost(999)'
    },
    {
      serial: 'NO. 2501-D',
      name: '花生流沙汤圆 · 极速破案符',
      quote: '“遇到再离奇的段错误，都能在30秒内一眼定位到是哪一行！”',
      mascot: '小丑先生',
      code: 'gdb.inspect_instant()'
    },
    {
      serial: 'NO. 2501-E',
      name: '牛肉大葱水饺 · 强筋健骨符',
      quote: '“体测轻松满分，天寒地冻手脚永远暖呼呼，冬天绝不感冒！”',
      mascot: '脚趾头',
      code: 'immunity.max = true'
    },
    {
      serial: 'NO. 2501-F',
      name: '抹茶红豆汤圆 · 发量浓密符',
      quote: '“发量浓密如初，发际线坚挺如泰山，思路连贯如泉涌！”',
      mascot: '杰尼龟',
      code: 'hair_density.protect()'
    },
    {
      serial: 'NO. 2501-G',
      name: '猪肉白菜水饺 · 全班团圆符',
      quote: '“25计算机1班全员到齐，一个都不能少，平安喜乐一整年！”',
      mascot: '油',
      code: 'class2501.together()'
    },
    {
      serial: 'NO. 2501-H',
      name: '桂花酒酿小圆子 · 心想事成符',
      quote: '“所有的代码奔赴星海，所有的付出皆有回响，冬至安康！”',
      mascot: '兔子牙',
      code: 'dreams.fulfilled = true'
    }
  ];

  function dispenseFortune() {
    playFeedbackBlip(750);
    const card = $('#fortune-ticket-card');
    if (!card) return;

    card.classList.remove('card-drawing');
    void card.offsetWidth; // 触发 reflow 重置动画
    card.classList.add('card-drawing');

    const slip = fortuneSlipsData[Math.floor(Math.random() * fortuneSlipsData.length)];
    $('#ticket-serial-id').textContent = slip.serial;
    $('#ticket-name-text').textContent = slip.name;
    $('#ticket-quote-text').textContent = slip.quote;
    $('#ticket-mascot-author').textContent = slip.mascot;
    $('#ticket-code-tag').textContent = slip.code;
  }

  function copyFortuneText() {
    const title = $('#ticket-name-text').textContent.trim();
    const quote = $('#ticket-quote-text').textContent.trim();
    const copyText = `🏮【25计1冬至幸运签】${title}\n✨ 签文：${quote}\n🥟 祝大家冬至快乐，代码零Bug，期末高分！`;

    navigator.clipboard?.writeText(copyText).then(() => {
      alert('已复制到剪贴板，快发到班级群分享你的冬至吉运吧！');
    }).catch(() => {
      alert('复制成功！');
    });
  }

  // --------------------------------------------------------------------------
  // 7. 星空便签墙真实数据与交互 (THE WISH WALL)
  // --------------------------------------------------------------------------
  const toneClasses = ['tone-paper', 'tone-lime', 'tone-coral', 'tone-midnight'];

  function renderWishes(wishes) {
    const container = $('#wishes-pinboard-grid');
    if (!container) return;

    if (!wishes || wishes.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--gray); font-family: var(--font-mono); padding: 40px;">暂无便签，成为今夜第一个贴上愿望的人吧！</div>';
      return;
    }

    container.innerHTML = wishes.map((w, idx) => {
      const tone = toneClasses[idx % toneClasses.length];
      return `
        <article class="wish-slip-card ${tone}" data-id="${w.id}">
          <div class="slip-header-meta">
            <span class="slip-author-tag">📌 ${w.name}</span>
            <span class="slip-time-tag">${w.time}</span>
          </div>
          <p class="slip-message-body">${w.text}</p>
          <div class="slip-footer-bar">
            <span style="font-family: var(--font-mono); font-size: 10px; opacity: 0.7;">CLASS 2501 NOTE</span>
            <button type="button" class="slip-warm-btn ${w.liked ? 'liked' : ''}" data-id="${w.id}">
              <span>🔥 暖一暖</span> <span class="like-tally">${w.likes}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    $$('.slip-warm-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        playFeedbackBlip(620);
        try {
          const res = await fetch('/api/solstice/wish/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: btn.dataset.id })
          });
          if (res.status === 410) {
            triggerSelfDestruct();
            return;
          }
          const data = await res.json();
          renderWishes(data.wishes);
        } catch {}
      });
    });

    $$('.wish-slip-card').forEach(card => {
      card.addEventListener('click', () => {
        const text = card.querySelector('.slip-message-body')?.textContent || '';
        const author = card.querySelector('.slip-author-tag')?.textContent || '';
        alert(`${author} 的冬至愿望：\n\n“${text}”`);
      });
    });
  }

  async function submitWishNote(e) {
    e.preventDefault();
    const nameField = $('#wish-author-field');
    const textField = $('#wish-content-field');
    const text = textField.value.trim();
    if (!text) return;

    playFeedbackBlip(700);
    try {
      const res = await fetch('/api/solstice/wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameField.value.trim(),
          text
        })
      });
      if (res.status === 410) {
        triggerSelfDestruct();
        return;
      }
      const data = await res.json();
      textField.value = '';
      renderWishes(data.wishes);
      alert('📌 你的冬至便签已成功固定在 25 计 1 愿望墙上！');
    } catch {
      alert('提交失败，请检查网络后重试');
    }
  }

  // --------------------------------------------------------------------------
  // 初始化与全局绑定
  // --------------------------------------------------------------------------
  function init() {
    initProgressBar();
    initAudio();
    renderMascotArchive();
    loadSolsticeState();

    // 倒计时每秒更新
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 阵营投票
    $('#vote-dumpling-btn')?.addEventListener('click', () => voteCamp('dumpling'));
    $('#vote-tangyuan-btn')?.addEventListener('click', () => voteCamp('tangyuan'));

    // 幸运签抽签机
    $('#machine-trigger-btn')?.addEventListener('click', dispenseFortune);
    $('#ticket-redraw-btn')?.addEventListener('click', dispenseFortune);
    $('#ticket-copy-btn')?.addEventListener('click', copyFortuneText);

    // 档案模态窗交互
    $('#dossier-close-btn')?.addEventListener('click', closeMascotDossier);
    $('#dossier-modal-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'dossier-modal-overlay') closeMascotDossier();
    });
    $('#dossier-prev-btn')?.addEventListener('click', () => openMascotDossier(currentDossierIndex - 1));
    $('#dossier-next-btn')?.addEventListener('click', () => openMascotDossier(currentDossierIndex + 1));
    $('#dossier-secret-btn')?.addEventListener('click', () => {
      playFeedbackBlip(880);
      const m = mascotArchiveData[currentDossierIndex];
      alert(`【${m.name} · 绝密彩蛋触发】\n\n${m.secret}`);
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMascotDossier();
    });

    // 愿望墙提交
    $('#wish-submit-form')?.addEventListener('submit', submitWishNote);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
