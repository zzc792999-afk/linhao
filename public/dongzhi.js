'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // --------------------------------------------------------------------------
  // 1. 飘雪粒子引擎 (手机端自动减半粒子，轻量丝滑)
  // --------------------------------------------------------------------------
  let snowCanvas = null;
  let snowCtx = null;
  let snowFlakes = [];
  let isSnowing = true;
  let snowAnimFrame = null;

  function initSnow() {
    snowCanvas = $('#snow-canvas');
    if (!snowCanvas) return;
    snowCtx = snowCanvas.getContext('2d');

    function resizeSnow() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
      createFlakes();
    }

    function createFlakes() {
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? 24 : 60; // 手机端节约性能
      snowFlakes = [];
      for (let i = 0; i < count; i++) {
        snowFlakes.push({
          x: Math.random() * snowCanvas.width,
          y: Math.random() * snowCanvas.height,
          radius: Math.random() * (isMobile ? 2.5 : 3.2) + 1,
          speed: Math.random() * 0.9 + 0.4,
          drift: Math.random() * 0.6 - 0.3,
          opacity: Math.random() * 0.6 + 0.3
        });
      }
    }

    function renderSnow() {
      if (!isSnowing) return;
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
      snowCtx.fillStyle = '#ffffff';

      for (let i = 0; i < snowFlakes.length; i++) {
        const f = snowFlakes[i];
        snowCtx.globalAlpha = f.opacity;
        snowCtx.beginPath();
        snowCtx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        snowCtx.fill();

        f.y += f.speed;
        f.x += f.drift;

        if (f.y > snowCanvas.height) {
          f.y = -5;
          f.x = Math.random() * snowCanvas.width;
        }
        if (f.x > snowCanvas.width) f.x = 0;
        if (f.x < 0) f.x = snowCanvas.width;
      }

      snowAnimFrame = requestAnimationFrame(renderSnow);
    }

    window.addEventListener('resize', resizeSnow, { passive: true });
    resizeSnow();
    renderSnow();

    // 绑定飘雪开关
    $('#snow-toggle-btn')?.addEventListener('click', () => {
      isSnowing = !isSnowing;
      const btn = $('#snow-toggle-btn');
      const text = $('#snow-status-text');
      if (btn) btn.classList.toggle('active', isSnowing);
      if (text) text.textContent = isSnowing ? '开' : '关';

      if (isSnowing) {
        renderSnow();
      } else {
        cancelAnimationFrame(snowAnimFrame);
        snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. 围炉暖音 (纯 Web Audio API 炉火与微沸声，支持偏好记住)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let isAudioPlaying = false;
  let noiseNode = null;
  let crackleInterval = null;

  function initAudio() {
    const saved = sessionStorage.getItem('solstice_audio_warm');
    if (saved === '1') {
      const resumeOnTouch = () => {
        toggleWarmAudio(true);
        window.removeEventListener('click', resumeOnTouch);
        window.removeEventListener('touchstart', resumeOnTouch);
      };
      window.addEventListener('click', resumeOnTouch, { once: true });
      window.addEventListener('touchstart', resumeOnTouch, { once: true });
    }

    $('#audio-toggle-btn')?.addEventListener('click', () => toggleWarmAudio());
  }

  function toggleWarmAudio(forceStart = false) {
    if (!isAudioPlaying || forceStart) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

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

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, audioCtx.currentTime);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start();

        crackleInterval = setInterval(() => {
          if (!isAudioPlaying || !audioCtx) return;
          try {
            const crackOsc = audioCtx.createOscillator();
            const crackGain = audioCtx.createGain();
            crackOsc.type = 'triangle';
            crackOsc.frequency.setValueAtTime(80 + Math.random() * 400, audioCtx.currentTime);
            crackGain.gain.setValueAtTime(0.04 * Math.random(), audioCtx.currentTime);
            crackGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
            crackOsc.connect(crackGain);
            crackGain.connect(audioCtx.destination);
            crackOsc.start();
            crackOsc.stop(audioCtx.currentTime + 0.04);
          } catch {}
        }, 320);

        isAudioPlaying = true;
        sessionStorage.setItem('solstice_audio_warm', '1');
      } catch (err) {
        console.warn('Audio start error:', err);
      }
    } else {
      if (noiseNode) {
        try { noiseNode.stop(); noiseNode.disconnect(); } catch {}
        noiseNode = null;
      }
      if (crackleInterval) {
        clearInterval(crackleInterval);
        crackleInterval = null;
      }
      isAudioPlaying = false;
      sessionStorage.setItem('solstice_audio_warm', '0');
    }

    const btn = $('#audio-toggle-btn');
    const text = $('#audio-status-text');
    if (btn) btn.classList.toggle('active', isAudioPlaying);
    if (text) text.textContent = isAudioPlaying ? '开' : '关';
  }

  function playTapBeep(freq = 540) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } catch {}
  }

  // --------------------------------------------------------------------------
  // 3. 今晚24:00自动自毁倒计时
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
    const overlay = $('#self-destruct-overlay');
    if (overlay) overlay.style.display = 'flex';
    setTimeout(() => {
      window.location.href = '/';
    }, 5000);
  }

  // --------------------------------------------------------------------------
  // 4. 饺子 VS 汤圆投票 (连接真实 API)
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

    const leadText = $('#score-lead-text');
    if (dCount > tCount) {
      leadText.textContent = `🥟 水饺派领先 ${dCount - tCount} 票！`;
    } else if (tCount > dCount) {
      leadText.textContent = `🍡 汤圆派领先 ${tCount - dCount} 票！`;
    } else {
      leadText.textContent = '双方旗鼓相当，平分秋色！';
    }

    const dCard = $('#camp-dumpling-box');
    const tCard = $('#camp-tangyuan-box');
    const dBtn = $('#vote-dumpling-btn');
    const tBtn = $('#vote-tangyuan-btn');
    const statusMsg = $('#pk-my-status');

    dCard.classList.toggle('voted', votes.myVote === 'dumpling');
    tCard.classList.toggle('voted', votes.myVote === 'tangyuan');
    dBtn.classList.toggle('voted', votes.myVote === 'dumpling');
    tBtn.classList.toggle('voted', votes.myVote === 'tangyuan');

    if (votes.myVote === 'dumpling') {
      statusMsg.innerHTML = '✔ 你已为 <strong>北方饺子派</strong> 投出一票！';
    } else if (votes.myVote === 'tangyuan') {
      statusMsg.innerHTML = '✔ 你已为 <strong>南方汤圆派</strong> 投出一票！';
    } else {
      statusMsg.textContent = '点击上方按钮，投出你在 25 计算机 1 班的专属一票！';
    }
  }

  async function voteCamp(choice) {
    playTapBeep(640);
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
      const campName = choice === 'dumpling' ? '北方饺子派 🥟' : '南方汤圆派 🍡';
      alert(`投票成功！你已站队【${campName}】！`);
    } catch {
      alert('网络开小差了，稍后重试');
    }
  }

  // --------------------------------------------------------------------------
  // 5. 咕嘟咕嘟捞幸运签
  // --------------------------------------------------------------------------
  const fortuneSlipsData = [
    {
      icon: '🥟',
      name: '韭菜鸡蛋水饺 · 编译零Bug符',
      quote: '“编译一次通过，高数90+，期末大作业答辩全场鼓掌！”',
      mascot: '鞋子送你加厚保暖冬袜，踩碎一切困难！'
    },
    {
      icon: '🍡',
      name: '黑芝麻流心汤圆 · 甜蜜满溢符',
      quote: '“心事如流心温润，代码如丝般顺滑，天天好心情！”',
      mascot: '刘邦身披王者神装，护体金光伴你暖冬！'
    },
    {
      icon: '🥟',
      name: '牛肉大葱水饺 · 能量满格符',
      quote: '“精神百倍活力在线，早八不困，熬夜赶Due依然神采奕奕！”',
      mascot: '龙鱼金光闪闪，招财纳福庇佑全班！'
    },
    {
      icon: '🍡',
      name: '花生碎糯米圆子 · 步步高升符',
      quote: '“好事总会‘花’生，绩点节节攀升，所有努力皆有回响！”',
      mascot: '脚趾头尴尬时刻抠出一座紫禁城，豪迈向前！'
    },
    {
      icon: '🥟',
      name: '三鲜暖胃水饺 · 锦鲤附体符',
      quote: '“抽签必中，考前划重点全考，各种好运悄然而至！”',
      mascot: '杰尼龟水炮轰穿一切阻碍，墨镜一戴谁也不爱！'
    },
    {
      icon: '🍡',
      name: '鲜肉小汤圆 · 无敌防御符',
      quote: '“发量浓密如初，发际线坚挺如泰山，思路连贯如泉涌！”',
      mascot: '兔子牙两颗大门牙闪闪发光，万物皆可嚼碎！'
    },
    {
      icon: '🥟',
      name: '猪肉白菜水饺 · 全班团圆符',
      quote: '“25计算机1班全员到齐，一个都不能少，平安喜乐一整年！”',
      mascot: '油全员加满油，一路顺滑飙到底！'
    },
    {
      icon: '🍡',
      name: '桂花酒酿小圆子 · 心想事成符',
      quote: '“所有的代码奔赴星海，所有的付出皆有回响，冬至安康！”',
      mascot: '小丑先生鼻尖一点红，同窗携手笑对生活！'
    }
  ];

  let currentFortune = null;

  function drawFortune() {
    playTapBeep(780);
    const pot = $('#pot-cooking-box');
    if (pot) {
      pot.classList.add('shaking');
      setTimeout(() => pot.classList.remove('shaking'), 600);
    }

    const slip = fortuneSlipsData[Math.floor(Math.random() * fortuneSlipsData.length)];
    currentFortune = slip;

    $('#t-icon').textContent = slip.icon;
    $('#t-name').textContent = slip.name;
    $('#t-quote').textContent = slip.quote;
    $('#t-mascot').textContent = slip.mascot;

    const card = $('#talisman-result-card');
    if (card) {
      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function copyFortune() {
    if (!currentFortune) return;
    const shareText = `🏮【25计1冬至幸运签】${currentFortune.name}\n✨ 签文：${currentFortune.quote}\n🐾 吉祥物：${currentFortune.mascot}\n🥟 祝全班冬至快乐，代码零Bug，期末高分！`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('已复制幸运签文，快发到微信/QQ班级群分享你的吉运吧！');
      }).catch(() => {
        alert('复制成功！');
      });
    } else {
      alert('已复制：\n\n' + shareText);
    }
  }

  // --------------------------------------------------------------------------
  // 6. 14 位吉祥物冬至图鉴与底部抽屉 (Bottom Sheet)
  // --------------------------------------------------------------------------
  const mascotData = [
    {
      id: 'shoe',
      num: '01',
      name: '鞋子',
      emoji: '👟',
      trait: '狂暴跑者',
      skill: '黄金切尔西破颜踢',
      damage: 'Lv.4 飞身暴踢敌方，造成 35 点破颜暴击伤害，每升一级伤害递增。',
      quote: '步履不停，踏碎一切困难！冬至记得穿加厚保暖袜，早八赶课不挨冻！',
      lore: '步履不停，踏碎一切困难。早八赶课最快的神器，冬至为全班送上温暖棉袜。',
      secret: '🧦 赠送你一双加厚保暖羊毛袜，暖脚一整冬！'
    },
    {
      id: 'oil',
      num: '02',
      name: '油',
      emoji: '🛢️',
      trait: '极速先锋',
      skill: '绝对顺滑超导狂飙',
      damage: 'Lv.4 喷射超导高能机油，造成 35 点顺滑冲击伤害，每升一级伤害递增。',
      quote: '全员加满油，一路顺滑飙到底！数九严寒也不凝固，动力拉满！',
      lore: '全员加满油，一路顺滑飙到底。永远热气腾腾，让班级每个齿轮飞速运转。',
      secret: '⛽ 加满 98 号极品高能汽油！战斗力狂飙！'
    },
    {
      id: 'liubang',
      num: '03',
      name: '刘邦',
      img: '/assets/liubang-1.jpg',
      trait: '汉高祖天王',
      skill: '统御战场霸王护盾',
      damage: 'Lv.4 大招全地图传送并展开霸王金光护盾，造成 35 点范围神圣伤害。',
      quote: '大风起兮云飞扬，五款王者神装全开！今夜围炉，与全班同袍共饮此杯！',
      lore: '大风起兮云飞扬，五款王者神装随升级解锁！气吞山河，庇佑全班安宁。',
      secret: '👑 汉高祖霸气举杯！全班今夜皆为上卿！'
    },
    {
      id: 'toe',
      num: '04',
      name: '脚趾头',
      emoji: '🦶',
      trait: '隐秘行者',
      skill: '神圣抠地十级地震',
      damage: 'Lv.4 尴尬时刻猛烈抠地，抠出紫禁城引发 35 点地震震荡伤害。',
      quote: '步履不停，尴尬时刻抠出一座紫禁城！即使天寒地冻，也要挺直腰杆向前冲！',
      lore: '步履不停，尴尬时刻抠出一座紫禁城。最接地气的伙伴，陪你走过每一步。',
      secret: '🏰 地底升起一座宏伟的紫禁城！全班免单！'
    },
    {
      id: 'arowana',
      num: '05',
      name: '龙鱼',
      emoji: '🐠',
      trait: '瑞兽锦鳞',
      skill: '龙跃九天真火吐息',
      damage: 'Lv.4 腾空化龙喷出烈焰真火，造成 35 点神兽水火交融伤害。',
      quote: '金鳞耀目，招财纳福庇佑全班！冬至转运，期末逢考必过，年年有余！',
      lore: '金鳞耀目，招财纳福庇佑全班！在静水深流中蕴藏翻江倒海的真龙之力。',
      secret: '🌊 金光护体！为你降下一场暴富红包雨！'
    },
    {
      id: 'squirtle',
      num: '06',
      name: '杰尼龟',
      emoji: '🐢',
      trait: '潮流墨镜客',
      skill: '究极高压水炮狂轰',
      damage: 'Lv.4 蓄力喷射超高压水柱，造成 35 点毁灭性水系冲击伤害。',
      quote: '墨镜一戴谁也不爱，水炮轰穿一切阻碍！冬至多喝热水，期末嘎嘎乱杀！',
      lore: '墨镜一戴谁也不爱，水炮轰穿一切阻碍！潇洒从容，酷盖气质拉满。',
      secret: '🕶️ 戴上酷炫黑超墨镜！帅气值翻倍！'
    },
    {
      id: 'buckteeth',
      num: '07',
      name: '兔子牙',
      emoji: '🦷',
      trait: '利齿萌神',
      skill: '极寒暴击两颗大门牙',
      damage: 'Lv.4 亮出巨大门牙猛烈咬碎一切坚冰，造成 35 点碎石破坚伤害。',
      quote: '两颗大门牙闪闪发光，万物皆可嚼碎！不管是冻梨还是汇编代码，一口咬碎！',
      lore: '两颗闪闪发光的大门牙，萌翻全场。不管是东北冻梨还是硬核汇编都能啃下。',
      secret: '🍐 嘎嘣脆！大门牙一秒吃掉一盘东北冰梨！'
    },
    {
      id: 'rednose',
      num: '08',
      name: '小丑先生',
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

  let currentMascotIdx = 0;

  function renderMascots() {
    const grid = $('#mascot-mobile-grid');
    if (!grid) return;

    grid.innerHTML = mascotData.map((m, idx) => {
      const avatarHtml = m.img
        ? `<img class="mascot-img-tag" src="${m.img}" alt="${m.name}" loading="lazy">`
        : `<span class="mascot-emoji-tag">${m.emoji}</span>`;

      return `
        <article class="mascot-touch-card" data-idx="${idx}" tabindex="0" role="button" aria-label="查看 ${m.name} 详情">
          <div class="card-num-badge">NO.${m.num}</div>
          <div class="mascot-thumb-stage">
            ${avatarHtml}
          </div>
          <h4 class="mascot-title-name">${m.name}</h4>
          <span class="mascot-role-pill">${m.trait}</span>
          <span class="tap-detail-hint">点击查看详情 ➔</span>
        </article>
      `;
    }).join('');

    $$('.mascot-touch-card').forEach(card => {
      card.addEventListener('click', () => {
        openMascotSheet(Number(card.dataset.idx));
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMascotSheet(Number(card.dataset.idx));
        }
      });
    });
  }

  function openMascotSheet(idx) {
    currentMascotIdx = (idx + mascotData.length) % mascotData.length;
    const m = mascotData[currentMascotIdx];
    playTapBeep(720);

    $('#sheet-name-text').textContent = m.name;
    $('#sheet-trait-text').textContent = m.trait;
    $('#sheet-skill-text').textContent = m.skill;
    $('#sheet-quote-text').textContent = `“${m.quote}”`;
    $('#sheet-lore-text').textContent = m.lore;
    $('#sheet-damage-text').textContent = m.damage;

    const box = $('#sheet-avatar-box');
    if (m.img) {
      box.innerHTML = `<img src="${m.img}" alt="${m.name}">`;
    } else {
      box.innerHTML = `<span style="font-size: 52px; line-height: 1;">${m.emoji}</span>`;
    }

    const overlay = $('#mascot-sheet-overlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMascotSheet() {
    const overlay = $('#mascot-sheet-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --------------------------------------------------------------------------
  // 7. 星空便签愿望墙 (连接真实 API)
  // --------------------------------------------------------------------------
  const wishColors = ['w-amber', 'w-orange', 'w-mint', 'w-blue'];

  function renderWishes(wishes) {
    const flow = $('#wish-notes-flow');
    if (!flow) return;

    if (!wishes || wishes.length === 0) {
      flow.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 30px; font-size: 13px;">暂无便签，快来写下全班今夜的第一条冬至愿望吧！</div>';
      return;
    }

    flow.innerHTML = wishes.map((w, idx) => {
      const colorClass = wishColors[idx % wishColors.length];
      return `
        <article class="wish-item-card ${colorClass}" data-id="${w.id}">
          <div class="note-head-row">
            <span class="note-author-label">🏮 ${w.name}</span>
            <span class="note-time-label">${w.time}</span>
          </div>
          <p class="note-body-text">${w.text}</p>
          <div class="note-foot-row">
            <span style="font-size: 11px; opacity: 0.7;">25计1专属夜话</span>
            <button type="button" class="btn-send-warm ${w.liked ? 'liked' : ''}" data-id="${w.id}">
              <span>🔥 送暖</span> <strong class="like-num">${w.likes}</strong>
            </button>
          </div>
        </article>
      `;
    }).join('');

    $$('.btn-send-warm').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        playTapBeep(660);
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

    $$('.wish-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const text = card.querySelector('.note-body-text')?.textContent || '';
        const author = card.querySelector('.note-author-label')?.textContent || '';
        alert(`${author} 的冬至愿望：\n\n“${text}”`);
      });
    });
  }

  async function submitWish(e) {
    e.preventDefault();
    const nameInput = $('#wish-name-input');
    const textInput = $('#wish-text-input');
    const text = textInput.value.trim();
    if (!text) return;

    playTapBeep(700);
    try {
      const res = await fetch('/api/solstice/wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          text
        })
      });
      if (res.status === 410) {
        triggerSelfDestruct();
        return;
      }
      const data = await res.json();
      textInput.value = '';
      renderWishes(data.wishes);
      alert('🏮 你的冬至愿望已成功放飞上墙！祝愿望成真！');
    } catch {
      alert('提交失败，请检查网络后重试');
    }
  }

  // --------------------------------------------------------------------------
  // 初始化总入口
  // --------------------------------------------------------------------------
  function init() {
    initSnow();
    initAudio();
    renderMascots();
    loadSolsticeState();

    // 倒计时
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 阵营投票
    $('#vote-dumpling-btn')?.addEventListener('click', () => voteCamp('dumpling'));
    $('#vote-tangyuan-btn')?.addEventListener('click', () => voteCamp('tangyuan'));

    // 幸运签抽签
    $('#draw-trigger-btn')?.addEventListener('click', drawFortune);
    $('#btn-redraw-fortune')?.addEventListener('click', drawFortune);
    $('#btn-copy-fortune')?.addEventListener('click', copyFortune);

    // 吉祥物底部抽屉
    $('#sheet-close-btn')?.addEventListener('click', closeMascotSheet);
    $('#mascot-sheet-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'mascot-sheet-overlay') closeMascotSheet();
    });
    $('#sheet-prev-btn')?.addEventListener('click', () => openMascotSheet(currentMascotIdx - 1));
    $('#sheet-next-btn')?.addEventListener('click', () => openMascotSheet(currentMascotIdx + 1));
    $('#sheet-easter-egg-btn')?.addEventListener('click', () => {
      playTapBeep(880);
      const m = mascotData[currentMascotIdx];
      alert(`【${m.name} · 冬至专属彩蛋】\n\n${m.secret}`);
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMascotSheet();
    });

    // 愿望墙提交
    $('#wish-form')?.addEventListener('submit', submitWish);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
