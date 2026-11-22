'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('hen-show-stage');
  if (!stage) return;

  const episodes = [
    {
      title: '机房要重启',
      lines: [
        ['大鸡', '还有三秒就重启！快帮我按 Ctrl+S！', '⌨️', 'rush', '即将重启'],
        ['小鸡', '存了！文件名我也帮你起好了。', '💾', 'hop', '保存成功'],
        ['大鸡', '怎么桌面上就一张图？我的作业呢？', '🖥️', 'tilt', '重启完成'],
        ['小鸡', '作业没存。你扑向键盘那一下，我截得特别清楚。', '📸', 'pop', '大鸡扑键盘.png']
      ],
      bonus: [
        ['小鸡', '刚才存的是截图。等等，还来得及补按 Ctrl+S！', '⌨️', 'hop', '最后一秒'],
        ['大鸡', '作业保住了。文件名怎么叫《大鸡求我的第三秒》？', '📁', 'pop', '作业已存档']
      ]
    },
    {
      title: '空蛋开箱',
      lines: [
        ['大鸡', '今天就拍开箱。这颗蛋这么大，里面总有东西吧？', '🥚', 'tilt', '准备开箱'],
        ['小鸡', '啄开了。蛋是空的，屏幕倒弹了个「滚木」！', '🪵', 'roll', '滚木'],
        ['小鸡', '换个节目。这个蛋壳正好给我做头盔。', '🥚', 'duck', '临时改拍'],
        ['小鸡', '开箱测评结束。蛋壳头盔遮光效果满分。', '🪖', 'blackout', '镜头一黑']
      ],
      bonus: [
        ['小鸡', '我先钻进去，咱们重拍一次。', '🥚', 'duck', '第二次开箱'],
        ['小鸡', '还是我。再重拍得加玉米。', '🌽', 'hop', '小鸡从蛋里探头']
      ]
    },
    {
      title: '归巢点名',
      lines: [
        ['大鸡', '睡觉前先点名。点到哪个，哪个进窝。', '📋', 'tilt', '鸡窝门口'],
        ['小鸡', '到！到！到！三个都齐了！', '🪺', 'hop', '连答三声'],
        ['大鸡', '慢着，怎么三个名字都是你一个声音？', '📋', 'tilt', '核对名单'],
        ['小鸡', '它们都睡了。现在点你，大鸡，喔一声算到。', '🪺', 'hop', '小鸡接过点名册']
      ],
      bonus: [
        ['小鸡', '我重排一下，从小到大进窝。最后一个负责关门。', '📋', 'hop', '从小到大'],
        ['大鸡', '轮到我了。门都让我堵严实了，还怎么关？', '🚪', 'tilt', '大鸡卡在门口']
      ]
    },
    {
      title: '机房请静音',
      lines: [
        ['大鸡', '机房请静音。谁先出声，谁今晚值夜。', '🔇', 'tilt', '全员静音'],
        ['小鸡', '我嘴都没张！', '🐾', 'stomp', '哒、哒、哒'],
        ['大鸡', '那怎么你走一步，就响一声键盘？', '⌨️', 'tilt', '找声音'],
        ['小鸡', '怪不得。机房地板装的全是青轴。', '⌨️', 'stomp', '地板是键盘']
      ],
      bonus: [
        ['小鸡', '我两只脚都抬起来了。怎么还在响？', '🐾', 'hop', '哒、哒还在响'],
        ['大鸡', '我就踩了下空格……值夜能带电脑去吗？', '⌨️', 'tilt', '大鸡悄悄松开空格键']
      ]
    }
  ];

  const lead = $('hen-show-lead');
  const chick = $('hen-show-chick');
  const progress = $('hen-show-progress');
  const next = $('hen-show-next');
  const auto = $('hen-show-auto');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const branchBeat = 1;
  const lastBeat = 3;
  let episode = 0, beat = -1, alternate = false, autoplay = !reducedMotion.matches, timer;

  function schedule() {
    clearTimeout(timer);
    if (autoplay && beat >= 0 && beat < lastBeat && !document.hidden) {
      const readTime = 1500 + $('hen-show-line').textContent.length * 115;
      const minimum = beat === branchBeat ? 6000 : 3200;
      timer = setTimeout(advance, Math.max(minimum, readTime));
    }
  }

  function draw() {
    const show = episodes[episode];
    const [speaker, text, prop, motion = '', caption = ''] = beat === -1
      ? ['开演', '点一下舞台上的大鸡。', show.lines[0][2]]
      : alternate ? show.bonus[beat - branchBeat - 1] : show.lines[beat];
    $('hen-show-title').textContent = show.title;
    $('hen-show-speaker').textContent = speaker;
    $('hen-show-line').textContent = text;
    $('hen-show-prop').textContent = prop;
    const cue = $('hen-show-cue');
    cue.textContent = caption;
    cue.hidden = !caption;
    stage.dataset.beat = String(beat);
    stage.dataset.episode = String(episode);
    stage.dataset.motion = motion;
    const frame = '第 ' + (beat + 1) + ' / ' + (lastBeat + 1) + ' 幕';
    progress.textContent = beat === -1 ? '第 ' + (episode + 1) + ' / ' + episodes.length + ' 集' :
      alternate ? (beat === lastBeat ? '隐藏结局' : '加戏 · ' + frame) : frame;
    const action = beat === -1 ? '开演' : beat === lastBeat ? '重播这出' : '下一幕';
    next.textContent = action;
    lead.setAttribute('aria-label', '大鸡，' + action);
    chick.disabled = beat !== branchBeat;
    $('hen-show-chick-tip').hidden = chick.disabled;
    auto.setAttribute('aria-pressed', String(autoplay));
    auto.textContent = autoplay ? '自动播放开' : '自动播放关';
    schedule();
  }

  function advance() {
    if (beat === lastBeat) {
      beat = 0;
      alternate = false;
    } else {
      beat++;
    }
    draw();
  }

  lead.addEventListener('click', advance);
  next.addEventListener('click', advance);
  chick.addEventListener('click', () => {
    if (beat !== branchBeat) return;
    alternate = true;
    advance();
    next.focus({preventScroll:true});
  });
  $('hen-show-swap').addEventListener('click', () => {
    episode = (episode + 1) % episodes.length;
    beat = 0;
    alternate = false;
    draw();
  });
  auto.addEventListener('click', () => {
    autoplay = !autoplay;
    auto.setAttribute('aria-pressed', String(autoplay));
    auto.textContent = autoplay ? '自动播放开' : '自动播放关';
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  draw();
})();
