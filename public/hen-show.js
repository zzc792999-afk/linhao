'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('hen-show-stage');
  if (!stage) return;

  const episodes = [
    {
      title: '机房要重启',
      lines: [
        ['大鸡', '主包，先存档！', '⌨️'],
        ['小鸡', '我刚踩了一下键盘！', '⌨️'],
        ['大鸡', '保存成功。文件夹里全是小鸡自拍。', '📸']
      ],
      bonus: ['小鸡', '我把自拍设成开机壁纸啦。', '🖥️']
    },
    {
      title: '空蛋开箱',
      lines: [
        ['大鸡', '这颗蛋看着挺沉，谁来拆？', '🥚'],
        ['小鸡', '啄一下……怎么弹出了滚木？', '🪵'],
        ['小鸡', '蛋是空的。蛋壳我留下当头盔。', '🪖']
      ],
      bonus: ['大鸡', '小鸡戴上蛋壳，就剩俩脚在找出口。', '🥚']
    },
    {
      title: '归巢点名',
      lines: [
        ['大鸡', '排队，点到再进窝。', '📋'],
        ['小鸡', '到！我刚才已经把三个座都占了。', '🪺'],
        ['小鸡', '现在我点名。大鸡，喔一声算到。', '📋']
      ],
      bonus: ['大鸡', '喔！答完到才发现，我也得排队。', '🪺']
    },
    {
      title: '机房请静音',
      lines: [
        ['大鸡', '机房里不许打鸣，大家开静音。', '🔇'],
        ['小鸡', '我一声都没出！', '🐾'],
        ['大鸡', '声音是关了，脚下还在震动。', '📳']
      ],
      bonus: ['小鸡', '我关震动。换键盘响。', '⌨️']
    }
  ];

  const lead = $('hen-show-lead');
  const chick = $('hen-show-chick');
  const progress = $('hen-show-progress');
  const next = $('hen-show-next');
  const auto = $('hen-show-auto');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let episode = 0, beat = -1, alternate = false, autoplay = !reducedMotion.matches, timer;

  function schedule() {
    clearTimeout(timer);
    if (autoplay && beat >= 0 && beat < 2 && !document.hidden) {
      timer = setTimeout(advance, beat === 0 ? 3000 : 4800);
    }
  }

  function draw() {
    const show = episodes[episode];
    const [speaker, text, prop] = beat === -1
      ? ['开演', '点一下舞台上的大鸡。', show.lines[0][2]]
      : beat === 2 && alternate ? show.bonus : show.lines[beat];
    $('hen-show-title').textContent = show.title;
    $('hen-show-speaker').textContent = speaker;
    $('hen-show-line').textContent = text;
    $('hen-show-prop').textContent = prop;
    stage.dataset.beat = String(beat);
    stage.dataset.episode = String(episode);
    progress.textContent = beat === -1 ? '第 ' + (episode + 1) + ' / ' + episodes.length + ' 集' :
      beat === 2 && alternate ? '隐藏结局' : '第 ' + (beat + 1) + ' / 3 幕';
    const action = beat === -1 ? '开演' : beat === 2 ? '重播这出' : '下一幕';
    next.textContent = action;
    lead.setAttribute('aria-label', '大鸡，' + action);
    chick.disabled = beat !== 1;
    $('hen-show-chick-tip').hidden = chick.disabled;
    auto.setAttribute('aria-pressed', String(autoplay));
    auto.textContent = autoplay ? '自动播放开' : '自动播放关';
    schedule();
  }

  function advance() {
    if (beat === 2) {
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
    if (beat !== 1) return;
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
