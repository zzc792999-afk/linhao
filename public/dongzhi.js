'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // --------------------------------------------------------------------------
  // 1. 漫天飘雪 Canvas 粒子系统
  // --------------------------------------------------------------------------
  let snowCanvas = null;
  let snowCtx = null;
  let snowParticles = [];
  let isSnowing = true;
  let animFrameId = null;

  function initSnow() {
    snowCanvas = document.getElementById('snow-canvas');
    if (!snowCanvas) return;
    snowCtx = snowCanvas.getContext('2d');

    function resize() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = window.innerWidth < 768 ? 40 : 80;
    snowParticles = [];
    for (let i = 0; i < count; i++) {
      snowParticles.push({
        x: Math.random() * snowCanvas.width,
        y: Math.random() * snowCanvas.height,
        r: Math.random() * 2.5 + 1,
        vy: Math.random() * 1.2 + 0.6,
        vx: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    renderSnow();
  }

  function renderSnow() {
    if (!snowCtx || !isSnowing) return;
    snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

    snowCtx.fillStyle = '#ffffff';
    for (let p of snowParticles) {
      snowCtx.beginPath();
      snowCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      snowCtx.globalAlpha = p.alpha;
      snowCtx.fill();

      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y * 0.01) * 0.3;

      if (p.y > snowCanvas.height) {
        p.y = -5;
        p.x = Math.random() * snowCanvas.width;
      }
      if (p.x > snowCanvas.width) p.x = 0;
      if (p.x < 0) p.x = snowCanvas.width;
    }
    snowCtx.globalAlpha = 1;

    animFrameId = requestAnimationFrame(renderSnow);
  }

  // --------------------------------------------------------------------------
  // 2. 纯 Web Audio API 炉火噼啪与咕嘟水沸白噪音
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let isAudioPlaying = false;
  let noiseNode = null;
  let gainNode = null;
  let crackleInterval = null;

  function toggleWarmAudio() {
    if (!isAudioPlaying) {
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
          output[i] = (lastOut + 0.02 * white) / 1.02; // 粉红/棕色低通
          lastOut = output[i];
          output[i] *= 1.5;
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioCtx.currentTime);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start();

        // 随机噼啪木柴爆裂声
        crackleInterval = setInterval(() => {
          if (!isAudioPlaying || !audioCtx) return;
          if (Math.random() < 0.6) playCracklePop();
        }, 350);

        isAudioPlaying = true;
        $('#audio-toggle-btn').classList.add('active');
        $('#audio-status-text').textContent = '开';
      } catch (e) {
        console.warn('Audio not supported:', e);
      }
    } else {
      stopWarmAudio();
    }
  }

  function stopWarmAudio() {
    isAudioPlaying = false;
    if (crackleInterval) clearInterval(crackleInterval);
    if (noiseNode) {
      try { noiseNode.stop(); } catch {}
      noiseNode = null;
    }
    $('#audio-toggle-btn')?.classList.remove('active');
    const txt = $('#audio-status-text');
    if (txt) txt.textContent = '关';
  }

  function playCracklePop() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 400, audioCtx.currentTime);
    g.gain.setValueAtTime(0.03, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  function playShortBoil() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.25);
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
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
    const curtain = $('#self-destruct-curtain');
    if (curtain) curtain.style.display = 'flex';
    // 6秒后自动返回班级主页
    setTimeout(() => {
      window.location.href = '/';
    }, 6000);
  }

  // --------------------------------------------------------------------------
  // 4. 饺子 vs 汤圆 PK 与愿望同步 API
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
      updatePKUI(data.votes);
      renderWishes(data.wishes);
    } catch (e) {
      console.warn('Load state err:', e);
    }
  }

  function updatePKUI(votes) {
    if (!votes) return;
    const dCount = votes.dumpling || 0;
    const tCount = votes.tangyuan || 0;
    const total = dCount + tCount || 1;

    $('#dumpling-vote-count').textContent = dCount;
    $('#tangyuan-vote-count').textContent = tCount;

    const dPct = Math.round((dCount / total) * 100);
    const tPct = 100 - dPct;

    $('#pk-bar-dumpling').style.width = `${dPct}%`;
    $('#pk-bar-tangyuan').style.width = `${tPct}%`;
    $('#dumpling-percent-text').textContent = `${dPct}%`;
    $('#tangyuan-percent-text').textContent = `${tPct}%`;

    const statusEl = $('#pk-my-status');
    if (votes.myVote === 'dumpling') {
      statusEl.innerHTML = '🥟 你已支持 <strong>北方饺子派</strong>！天冷多吃饺子不冻耳朵！';
    } else if (votes.myVote === 'tangyuan') {
      statusEl.innerHTML = '🍡 你已支持 <strong>南方汤圆派</strong>！甜甜蜜蜜团团圆圆！';
    } else {
      statusEl.textContent = '快为你支持的冬至美味投上一票吧！';
    }
  }

  async function voteCamp(choice) {
    try {
      playShortBoil();
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
      updatePKUI(data.votes);
    } catch (e) {
      alert('网络开小差了，请重试');
    }
  }

  // --------------------------------------------------------------------------
  // 5. 咕嘟咕嘟 · 捞冬至专属幸运签
  // --------------------------------------------------------------------------
  const luckyTalismans = [
    {
      icon: '🥟',
      name: '韭菜鸡蛋水饺 · 编译零Bug符',
      mascot: '吉祥物鞋子寄语：穿上本鞋送你的加厚纯棉保暖袜，谁踩我都不怕冷！',
      text: '代码编译一次通过，高数90+，期末大作业答辩全场鼓掌！',
      stars: '★★★★★',
      code: 'exit(0); // 顺顺利利'
    },
    {
      icon: '🍡',
      name: '黑芝麻爆浆汤圆 · 高甜充能符',
      mascot: '吉祥物龙鱼寄语：龙鱼大仙为你吐出一连串锦鲤泡泡，玄学加满！',
      text: '今晚枕头格外软，早八有人帮忙占前排座，每天都能精神饱满！',
      stars: '★★★★★',
      code: 'while(happy) sleep(well);'
    },
    {
      icon: '🥟',
      name: '鲜虾玉米水饺 · 锦鲤附体符',
      mascot: '吉祥物刘邦寄语：今天不拔剑，本邦只烤红薯！大风起兮云飞扬，吃饱心不慌！',
      text: '抢课秒进心仪课，抽卡次次保底提前出金，生活处处有惊喜！',
      stars: '★★★★★',
      code: 'fortune++; // 运势暴涨'
    },
    {
      icon: '🍡',
      name: '花生流沙汤圆 · 极速破案符',
      mascot: '吉祥物红鼻同学寄语：红鼻戴上毛绒大耳罩，祝全班同学冬至热气腾腾！',
      text: '遇到再离奇的段错误，都能在30秒内一眼定位到哪一行！',
      stars: '★★★★★',
      code: 'gdb.fast_inspect();'
    },
    {
      icon: '🥟',
      name: '牛肉大葱水饺 · 强筋健骨符',
      mascot: '吉祥物脚趾头寄语：穿上防冻小棉套啦，脚趾头再也不会受冻啦！',
      text: '冬季体育打卡体测轻松满分，天寒地冻手脚永远暖呼呼！',
      stars: '★★★★★',
      code: 'health += 100;'
    },
    {
      icon: '🍡',
      name: '抹茶红豆汤圆 · 发量浓密符',
      mascot: '吉祥物杰尼龟寄语：杰尼龟~（红围巾戴好，写完代码早点钻被窝）',
      text: '发量浓密如初，发际线坚挺如泰山，思路如泉涌！',
      stars: '★★★★★',
      code: 'hair_density.protect();'
    },
    {
      icon: '🥟',
      name: '猪肉白菜水饺 · 全班团圆符',
      mascot: '吉祥物油寄语：今晚热油专炸黄金酥肉，给25计算机1班全员加餐！',
      text: '25计算机1班全员到齐，一个都不能少，平安喜乐一整年！',
      stars: '★★★★★',
      code: 'class2501.together(forever);'
    },
    {
      icon: '🍡',
      name: '桂花酒酿小圆子 · 心想事成符',
      mascot: '吉祥物兔子牙寄语：咔嚓咔嚓啃大冻梨，甜在嘴里，暖在心头！',
      text: '所有的代码奔赴星海，所有的付出如期回响，冬至安康！',
      stars: '★★★★★',
      code: 'dreams.fulfilled = true;'
    }
  ];

  function drawLuckyTalisman() {
    playShortBoil();
    const item = luckyTalismans[Math.floor(Math.random() * luckyTalismans.length)];

    $('#t-icon').textContent = item.icon;
    $('#t-name').textContent = item.name;
    $('#t-mascot').textContent = item.mascot;
    $('#t-text').textContent = item.text;
    $('#t-stars').textContent = item.stars;
    $('#t-code').textContent = item.code;

    $('#talisman-overlay').style.display = 'flex';
  }

  function copyTalismanText() {
    const name = $('#t-name').textContent;
    const text = $('#t-text').textContent;
    const copyString = `🏮【25计1冬至幸运签】${name}\n✨ 祝福：“${text}”\n🥟 祝大家冬至快乐，代码零Bug，期末稳过！`;
    navigator.clipboard?.writeText(copyString).then(() => {
      alert('已复制到剪贴板，快发到班级群分享你的冬至吉运吧！');
    }).catch(() => {
      alert('复制成功！文案已就绪');
    });
  }

  // --------------------------------------------------------------------------
  // 6. 14 大吉祥物冬至送暖联欢会
  // --------------------------------------------------------------------------
  const mascotsData = [
    { name: '鞋子', icon: '👟', gear: '🧦', tag: '换上厚棉袜', quote: '天冷了，今天不打架！本鞋送大家纯棉暖宝宝，踩谁都不冷！' },
    { name: '油', icon: '🛢️', gear: '🔥', tag: '滚烫酥肉油', quote: '冬至热油下锅！香喷喷炸酥肉、炸油条，给写代码的同学们加餐！' },
    { name: '刘邦', icon: '⚔️', gear: '🍠', tag: '手捧烤红薯', quote: '大风起兮云飞扬，今天不斩白蛇只剥红薯！吃饱期末不慌张！' },
    { name: '脚趾头', icon: '🦶', gear: '🧣', tag: '穿棉脚套', quote: '感谢大家照顾！穿上防冻保暖棉套，脚趾头再也不会冻红啦~' },
    { name: '龙鱼', icon: '🐟', gear: '♨️', tag: '温泉吐爱心', quote: '冬至跃龙门，考前拜龙鱼！全班高数离散全通过，锦鲤附体！' },
    { name: '杰尼龟', icon: '🐢', gear: '🧣', tag: '戴红围巾', quote: '杰尼杰尼~（红围巾戴好啦，吃完热汤圆记得早点钻被窝！）' },
    { name: '兔子牙', icon: '🐰', gear: '🍐', tag: '啃甜冻梨', quote: '咔嚓咔嚓啃大冻梨！冰凉爽脆，大门牙吃嘛嘛香！' },
    { name: '红鼻同学', icon: '🔴', gear: '🎧', tag: '毛绒暖耳罩', quote: '虽然鼻子天生红，但心里热乎乎的！全班同学冬至快乐！' },
    { name: '橘猫', icon: '🐱', gear: '🐾', tag: '揣手手烤火', quote: '喵呜~ 趴在暖气片上，肚皮烤得热烘烘，舒服得呼噜呼噜~' },
    { name: '佩奇', icon: '🐖', gear: '🥟', tag: '抱大饺子', quote: '泥坑太冷结冰啦！今晚抱住大饺子，祝全班同学快快乐乐！' },
    { name: '豆苗', icon: '🌱', gear: '🧢', tag: '戴小红帽', quote: '即使是数九寒冬，小豆苗也在积蓄力量破雪生长！冲冲冲！' },
    { name: '问号', icon: '❓', gear: '🏮', tag: '提小灯笼', quote: '今晚还问为什么代码有Bug？不，今晚吃饱睡觉最重要！' },
    { name: '墨镜', icon: '🕶️', gear: '❄️', tag: '雪地防炫光', quote: '冬至的雪再耀眼，也挡不住25计算机1班同学们的帅气！' },
    { name: '柴犬', icon: '🐶', gear: '🎖️', tag: '戴雷锋帽', quote: '汪汪汪！戴好雷锋帽，来给敲代码敲累的同学暖爪爪！' }
  ];

  function renderMascots() {
    const container = $('#mascots-festive-grid');
    if (!container) return;

    container.innerHTML = mascotsData.map(m => `
      <div class="mascot-festive-card" data-name="${m.name}" data-icon="${m.icon}" data-quote="${m.quote}">
        <div class="m-icon-wrap">
          <span>${m.icon}</span>
          <span class="m-winter-gear">${m.gear}</span>
        </div>
        <span class="m-name">${m.name}</span>
        <span class="m-tag">${m.tag}</span>
      </div>
    `).join('');

    $$('.mascot-festive-card').forEach(card => {
      card.addEventListener('click', () => {
        playShortBoil();
        showMascotDialog(card.dataset.icon, card.dataset.name, card.dataset.quote);
      });
    });
  }

  let toastTimer = null;
  function showMascotDialog(avatar, name, text) {
    const toast = $('#mascot-dialog-toast');
    if (!toast) return;

    $('#toast-avatar').textContent = avatar;
    $('#toast-name').textContent = name;
    $('#toast-text').textContent = text;

    toast.style.display = 'flex';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }

  // --------------------------------------------------------------------------
  // 7. 星空孔明灯 · 暖冬愿望墙
  // --------------------------------------------------------------------------
  function renderWishes(wishes) {
    const container = $('#wishes-wall-grid');
    if (!container) return;

    if (!wishes || wishes.length === 0) {
      container.innerHTML = '<div class="wish-loading-hint">还没有愿望，成为第一个放飞孔明灯的人吧！</div>';
      return;
    }

    container.innerHTML = wishes.map(w => `
      <div class="wish-card" data-id="${w.id}">
        <div class="wish-card-head">
          <span class="wish-author">🏮 ${w.name}</span>
          <span class="wish-time">${w.time}</span>
        </div>
        <p class="wish-text">${w.text}</p>
        <div class="wish-card-foot">
          <button type="button" class="wish-like-btn ${w.liked ? 'liked' : ''}" data-id="${w.id}">
            🔥 暖一暖 <span class="like-count">${w.likes}</span>
          </button>
        </div>
      </div>
    `).join('');

    $$('.wish-like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        playShortBoil();
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
  }

  async function submitWish(e) {
    e.preventDefault();
    const nameInput = $('#wish-name-input');
    const textInput = $('#wish-text-input');
    const text = textInput.value.trim();
    if (!text) return;

    playShortBoil();
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
      alert('🏮 暖冬孔明灯已带着你的心愿缓缓飞向星空！');
    } catch (e) {
      alert('放飞失败，请稍后再试');
    }
  }

  // --------------------------------------------------------------------------
  // 初始化与事件绑定
  // --------------------------------------------------------------------------
  function init() {
    initSnow();
    renderMascots();
    loadSolsticeState();

    // 倒计时每秒更新
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 顶部按钮控制
    $('#snow-toggle-btn')?.addEventListener('click', () => {
      isSnowing = !isSnowing;
      $('#snow-toggle-btn').classList.toggle('active', isSnowing);
      $('#snow-status-text').textContent = isSnowing ? '开' : '关';
      if (isSnowing && !animFrameId) renderSnow();
    });

    $('#audio-toggle-btn')?.addEventListener('click', toggleWarmAudio);

    // 投票按钮
    $('#vote-dumpling-btn')?.addEventListener('click', () => voteCamp('dumpling'));
    $('#vote-tangyuan-btn')?.addEventListener('click', () => voteCamp('tangyuan'));

    // 捞幸运签
    $('#draw-lucky-btn')?.addEventListener('click', drawLuckyTalisman);
    $('#talisman-again-btn')?.addEventListener('click', drawLuckyTalisman);
    $('#talisman-close-btn')?.addEventListener('click', () => {
      $('#talisman-overlay').style.display = 'none';
    });
    $('#talisman-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'talisman-overlay') {
        $('#talisman-overlay').style.display = 'none';
      }
    });
    $('#talisman-copy-btn')?.addEventListener('click', copyTalismanText);

    // 许愿表单
    $('#wish-form')?.addEventListener('submit', submitWish);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
