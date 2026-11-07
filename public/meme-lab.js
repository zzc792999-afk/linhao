'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // --------------------------------------------------------------------------
  // 数据与状态
  // --------------------------------------------------------------------------
  let canvas = null;
  let ctx = null;
  let layers = [];
  let selectedLayerIndex = -1;
  let historyStack = [];
  let redoStack = [];
  let isDragging = false;
  let dragMode = null; // 'move' | 'scale' | 'rotate'
  let dragStartX = 0, dragStartY = 0;
  let initialLayerState = null;

  // 发疯文学语料库
  const crazyQuotes = {
    programmer: [
      '代码怎么又红了！谁写的这个Bug？！哦是我写的，那没事了，接着写下一个Bug！',
      '重构！我今天必须把这三千行屎山代码重构！等等……怎么删了三行连登录都进不去了？！',
      '我没疯！我只是在跟编译器对齐心智模型！NullPointerException 它难道就没有错吗？！',
      '运行无报错，但是功能完全不对！这难道就是传说中的量子力学编程？！',
      '只要我不看控制台，我的代码就永远没有报错！'
    ],
    morning: [
      '早八！为什么这个星球上会存在早八这种东西！我与早八不共戴天！',
      '闹钟响了十六次，我醒了，但我的灵魂还在枕头上做高数卷子！',
      '早八第一节课：我是谁？我在哪？黑板上写的是甲骨文还是线性代数？！',
      '别叫我起床，我正在梦里拯救世界，顺便把上午的课给退了！',
      '走进教室的那一刻，我突然觉得床是我这辈子唯一的挚爱。'
    ],
    exam: [
      '高数看我像在看猴，我看高数像在看外星文明遗迹！',
      '全部退后！期末周到了，我要开始无差别相信所有的考场玄学了！',
      '书翻了一页又一页，知识从左脑流进右脑，再从天灵盖蒸发！',
      '遇事不决选 C，三长一短选最短，三短一长选最长，参差不齐全蒙 B！',
      '老师！您给的重点是整本书目录吗？！救救孩子，给个60分孩子给您磕头了！'
    ],
    abstract: [
      '尊重、理解、祝福、锁死、并在班级群里疯狂发狗头！',
      '你说的对，但25计算机1班是一款全班一起养14位吉祥物的开放世界冒险游戏！',
      '人生就像一盘散沙，不用风吹，写两行代码就自己崩塌了。',
      '我的精神状态良好，不仅能在机房做仰卧起坐，还能用汇编语言唱rap！',
      '已老实，求放过，下次还敢！'
    ]
  };

  // 人话翻译器字典
  const jargonDict = [
    { jargon: '对齐颗粒度', human: '商量一下细节，别各搞各的' },
    { jargon: '赋能', human: '帮忙 / 提供点工具' },
    { jargon: '闭环', human: '做完它，别烂尾' },
    { jargon: '底层逻辑', human: '最根本的原因' },
    { jargon: '组合拳', human: '一起上多个招数' },
    { jargon: '抓手', human: '切入点 / 具体办法' },
    { jargon: '心智', human: '习惯和想法' },
    { jargon: '痛点', human: '让人特别难受的问题' },
    { jargon: '降维打击', human: '碾压 / 彻底完胜' },
    { jargon: '复盘', human: '总结反思为什么搞砸了' },
    { jargon: '打法', human: '做事的方法' },
    { jargon: '延迟满足', human: '先吃苦，以后再说' }
  ];

  // --------------------------------------------------------------------------
  // 1. Canvas 核心引擎
  // --------------------------------------------------------------------------
  function initCanvas() {
    canvas = document.getElementById('meme-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // 逻辑分辨率设为 600x600，高保真抗锯齿
    canvas.width = 600;
    canvas.height = 600;

    // 默认添加一个模板背景和一条引导文字
    loadDefaultTemplate();

    // 绑定鼠标与触屏事件
    bindCanvasEvents();

    saveHistory();
    renderCanvas();
  }

  function loadDefaultTemplate() {
    layers = [
      {
        type: 'bg',
        kind: 'panda',
        color: '#FFFFFF'
      },
      {
        type: 'text',
        text: '代码敲不动了，来整点活',
        x: 300,
        y: 520,
        fontSize: 34,
        color: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 5,
        bold: true,
        rotation: 0
      }
    ];
    selectedLayerIndex = 1;
  }

  function saveHistory() {
    historyStack.push(JSON.stringify(layers));
    if (historyStack.length > 30) historyStack.shift();
    redoStack = []; // 清空重做栈
  }

  function undo() {
    if (historyStack.length > 1) {
      redoStack.push(historyStack.pop());
      layers = JSON.parse(historyStack[historyStack.length - 1]);
      selectedLayerIndex = Math.min(selectedLayerIndex, layers.length - 1);
      renderCanvas();
      syncLayerControls();
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      const state = redoStack.pop();
      historyStack.push(state);
      layers = JSON.parse(state);
      selectedLayerIndex = Math.min(selectedLayerIndex, layers.length - 1);
      renderCanvas();
      syncLayerControls();
    }
  }

  // 绘制完整 Canvas
  function renderCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layers.forEach((layer, idx) => {
      ctx.save();
      if (layer.type === 'bg') {
        drawBackground(layer);
      } else if (layer.type === 'text') {
        drawTextLayer(layer);
      } else if (layer.type === 'sticker') {
        drawStickerLayer(layer);
      } else if (layer.type === 'image') {
        drawImageLayer(layer);
      }
      ctx.restore();

      // 如果是选中的图层，绘制选框与交互手柄
      if (idx === selectedLayerIndex && layer.type !== 'bg') {
        drawSelectionBox(layer);
      }
    });
  }

  // 绘制背景预设
  function drawBackground(layer) {
    ctx.fillStyle = layer.color || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (layer.kind === 'panda') {
      // 熊猫头简笔画
      ctx.save();
      ctx.translate(300, 240);
      // 耳朵
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-110, -90, 42, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(110, -90, 42, 0, Math.PI * 2); ctx.fill();
      // 头部
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(0, 0, 140, 120, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 黑眼圈
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.ellipse(-55, -25, 34, 24, Math.PI / 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(55, -25, 34, 24, -Math.PI / 8, 0, Math.PI * 2); ctx.fill();
      // 眼睛高光
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-50, -28, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(50, -28, 6, 0, Math.PI * 2); ctx.fill();
      // 鼻子嘴巴
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 15, 12, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 35, 45, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.restore();
    } else if (layer.kind === 'bsod') {
      // 蓝屏死机报错
      ctx.fillStyle = '#0055aa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px monospace';
      ctx.fillText(':(', 60, 120);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('你的计算机遇到问题，需要摸鱼。', 60, 180);
      ctx.font = '16px monospace';
      ctx.fillText('终止代码: ERROR_HOMEWORK_OVERFLOW', 60, 240);
      ctx.fillText('进度: 99% 已完成 (卡死)', 60, 280);
    } else if (layer.kind === 'cert') {
      // 奖状底图
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c59b27';
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, 540, 540);
      ctx.lineWidth = 2;
      ctx.strokeRect(42, 42, 516, 516);
      ctx.fillStyle = '#b32400';
      ctx.font = 'bold 44px serif';
      ctx.textAlign = 'center';
      ctx.fillText('光 荣 奖 状', 300, 120);
      ctx.font = '16px serif';
      ctx.fillStyle = '#666';
      ctx.fillText('特此颁发给 25计算机1班 同学：', 300, 180);
    } else if (layer.customImg) {
      ctx.drawImage(layer.customImg, 0, 0, canvas.width, canvas.height);
    }
  }

  // 绘制文字图层
  function drawTextLayer(layer) {
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation || 0) * Math.PI / 180);
    ctx.font = `${layer.bold ? 'bold ' : ''}${layer.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (layer.strokeWidth > 0 && layer.strokeColor) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(layer.text, 0, 0);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(layer.text, 0, 0);
  }

  // 绘制贴纸图层
  function drawStickerLayer(layer) {
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation || 0) * Math.PI / 180);
    ctx.font = `${layer.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(layer.char, 0, 0);
  }

  // 绘制图片图层
  function drawImageLayer(layer) {
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation || 0) * Math.PI / 180);
    ctx.drawImage(layer.img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
  }

  // 绘制选中虚线框与旋转缩放手柄
  function drawSelectionBox(layer) {
    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation || 0) * Math.PI / 180);

    const bounds = getLayerBounds(layer);
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-bounds.w / 2 - 8, -bounds.h / 2 - 8, bounds.w + 16, bounds.h + 16);

    // 缩放手柄（右下角）
    ctx.setLineDash([]);
    ctx.fillStyle = '#FF755E';
    ctx.fillRect(bounds.w / 2 + 2, bounds.h / 2 + 2, 12, 12);

    // 旋转手柄（顶部伸出小圆点）
    ctx.beginPath();
    ctx.arc(0, -bounds.h / 2 - 24, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#B9D96C';
    ctx.fill();
    ctx.strokeStyle = '#202020';
    ctx.stroke();

    ctx.restore();
  }

  // 计算图层包围盒尺寸
  function getLayerBounds(layer) {
    if (layer.type === 'text') {
      ctx.save();
      ctx.font = `${layer.bold ? 'bold ' : ''}${layer.fontSize}px sans-serif`;
      const metrics = ctx.measureText(layer.text);
      ctx.restore();
      return {
        w: metrics.width,
        h: layer.fontSize * 1.2
      };
    } else if (layer.type === 'sticker') {
      return {
        w: layer.size,
        h: layer.size
      };
    } else if (layer.type === 'image') {
      return {
        w: layer.width,
        h: layer.height
      };
    }
    return { w: 50, h: 50 };
  }

  // --------------------------------------------------------------------------
  // 交互事件：拖动、缩放、旋转 (支持鼠标与移动端触摸)
  // --------------------------------------------------------------------------
  function fitCanvasContainer() {
    const container = document.getElementById('canvas-container');
    if (container && container.clientWidth > 0) {
      container.style.height = `${container.clientWidth}px`;
    }
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const width = rect.width > 0 ? rect.width : 1;
    const height = rect.height > 0 ? rect.height : 1;
    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    return {
      x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY))
    };
  }

  function bindCanvasEvents() {
    const onStart = e => {
      const pos = getCanvasCoords(e);
      dragStartX = pos.x;
      dragStartY = pos.y;

      // 检测是否命中了选中的旋转手柄或缩放手柄
      if (selectedLayerIndex > 0) {
        const curLayer = layers[selectedLayerIndex];
        const bounds = getLayerBounds(curLayer);

        // 旋转手柄位置 (顶部 -bounds.h/2 - 24)
        const rad = (curLayer.rotation || 0) * Math.PI / 180;
        const handleX = curLayer.x + (-bounds.h / 2 - 24) * -Math.sin(rad);
        const handleY = curLayer.y + (-bounds.h / 2 - 24) * Math.cos(rad);
        const distRot = Math.hypot(pos.x - handleX, pos.y - handleY);

        if (distRot < 30) {
          dragMode = 'rotate';
          isDragging = true;
          initialLayerState = { ...curLayer };
          e.preventDefault();
          return;
        }

        // 缩放手柄位置 (右下角)
        const cornerDist = Math.hypot(pos.x - (curLayer.x + bounds.w / 2), pos.y - (curLayer.y + bounds.h / 2));
        if (cornerDist < 35) {
          dragMode = 'scale';
          isDragging = true;
          initialLayerState = { ...curLayer };
          e.preventDefault();
          return;
        }
      }

      // 检测击中哪个图层（自顶向下）
      let hit = -1;
      for (let i = layers.length - 1; i >= 1; i--) {
        const layer = layers[i];
        const bounds = getLayerBounds(layer);
        const dx = pos.x - layer.x;
        const dy = pos.y - layer.y;
        if (Math.abs(dx) <= bounds.w / 2 + 16 && Math.abs(dy) <= bounds.h / 2 + 16) {
          hit = i;
          break;
        }
      }

      if (hit !== -1) {
        selectedLayerIndex = hit;
        dragMode = 'move';
        isDragging = true;
        initialLayerState = { ...layers[hit] };
        syncLayerControls();
        renderCanvas();
        e.preventDefault();
      } else {
        selectedLayerIndex = -1;
        syncLayerControls();
        renderCanvas();
      }
    };

    const onMove = e => {
      if (!isDragging || selectedLayerIndex <= 0) return;
      const pos = getCanvasCoords(e);
      const layer = layers[selectedLayerIndex];

      if (dragMode === 'move') {
        layer.x = initialLayerState.x + (pos.x - dragStartX);
        layer.y = initialLayerState.y + (pos.y - dragStartY);
      } else if (dragMode === 'rotate') {
        const angle = Math.atan2(pos.y - layer.y, pos.x - layer.x) * 180 / Math.PI + 90;
        layer.rotation = Math.round(angle);
      } else if (dragMode === 'scale') {
        const factor = Math.max(0.3, 1 + (pos.x - dragStartX) / 150);
        if (layer.type === 'text') {
          layer.fontSize = Math.max(14, Math.min(120, Math.round(initialLayerState.fontSize * factor)));
        } else if (layer.type === 'sticker') {
          layer.size = Math.max(20, Math.min(200, Math.round(initialLayerState.size * factor)));
        }
      }

      renderCanvas();
      e.preventDefault();
    };

    const onEnd = () => {
      if (isDragging) {
        isDragging = false;
        dragMode = null;
        saveHistory();
      }
    };

    canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    canvas.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  // 同步控件面板状态
  function syncLayerControls() {
    const textInput = document.getElementById('meme-text-input');
    const sizeSlider = document.getElementById('meme-size-slider');
    const deleteBtn = document.getElementById('meme-delete-layer-btn');

    if (selectedLayerIndex > 0) {
      const cur = layers[selectedLayerIndex];
      if (cur.type === 'text') {
        if (textInput) {
          textInput.value = cur.text;
          textInput.disabled = false;
        }
        if (sizeSlider) {
          sizeSlider.value = cur.fontSize;
          sizeSlider.disabled = false;
        }
      } else {
        if (textInput) textInput.disabled = true;
        if (sizeSlider && cur.type === 'sticker') {
          sizeSlider.value = cur.size;
          sizeSlider.disabled = false;
        }
      }
      if (deleteBtn) deleteBtn.disabled = false;
    } else {
      if (textInput) {
        textInput.value = '';
        textInput.disabled = true;
      }
      if (deleteBtn) deleteBtn.disabled = true;
    }
  }

  // --------------------------------------------------------------------------
  // 图层操作动作
  // --------------------------------------------------------------------------
  function addTextLayer(text = '输入文字') {
    layers.push({
      type: 'text',
      text,
      x: 300,
      y: 300,
      fontSize: 36,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4,
      bold: true,
      rotation: 0
    });
    selectedLayerIndex = layers.length - 1;
    saveHistory();
    syncLayerControls();
    renderCanvas();
  }

  function addStickerLayer(char) {
    layers.push({
      type: 'sticker',
      char,
      x: 300,
      y: 300,
      size: 64,
      rotation: 0
    });
    selectedLayerIndex = layers.length - 1;
    saveHistory();
    syncLayerControls();
    renderCanvas();
  }

  function deleteSelectedLayer() {
    if (selectedLayerIndex > 0) {
      layers.splice(selectedLayerIndex, 1);
      selectedLayerIndex = -1;
      saveHistory();
      syncLayerControls();
      renderCanvas();
    }
  }

  // --------------------------------------------------------------------------
  // 导出与发布
  // --------------------------------------------------------------------------
  function downloadMemePng() {
    // 导出前先取消选中态框
    const prevSelected = selectedLayerIndex;
    selectedLayerIndex = -1;
    renderCanvas();

    canvas.toBlob(blob => {
      selectedLayerIndex = prevSelected;
      renderCanvas();

      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `25计1-梗图-${Date.now().toString().slice(-6)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('梗图已导出为 PNG！');
    }, 'image/png');
  }

  async function publishMeme() {
    const prevSelected = selectedLayerIndex;
    selectedLayerIndex = -1;
    renderCanvas();

    const dataUrl = canvas.toDataURL('image/png');
    selectedLayerIndex = prevSelected;
    renderCanvas();

    const defaultTitle = layers.find(l => l.type === 'text')?.text || '25计1抽象瞬间';
    const title = prompt('给这幅梗图起个标题：', defaultTitle.slice(0, 30)) || '无题梗图';
    const nickname = (window.storage ? window.storage.get('nickname', '') : '') || prompt('你的大名或匿名外号：', '路过的小码农') || '匿名同学';

    toast('正在发布到抽象广场…');
    try {
      const res = await fetch('/api/memes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          nickname,
          image: dataUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发布失败');

      toast('发布成功！全班同学刷新即可看到 ✦');
      loadMemesGallery();
      // 切换到抽象广场标签
      switchMemeTab('gallery');
    } catch (e) {
      toast(e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 2. 抽象广场与排行榜渲染
  // --------------------------------------------------------------------------
  async function loadMemesGallery() {
    const galleryContainer = document.getElementById('meme-gallery-list');
    const podiumContainer = document.getElementById('meme-podium-list');
    if (!galleryContainer) return;

    try {
      const res = await fetch('/api/memes');
      const data = await res.json();
      if (!res.ok) return;

      const memes = data.memes || [];
      const topMemes = data.topMemes || [];

      // 渲染广场瀑布流
      galleryContainer.innerHTML = '';
      if (memes.length === 0) {
        galleryContainer.innerHTML = '<p class="small-note" style="grid-column: 1/-1; text-align: center; padding: 32px 0;">抽象广场暂时空空如也，快去“梗图工厂”制作第一张班级神作吧！</p>';
      } else {
        memes.forEach(m => {
          const card = document.createElement('article');
          card.className = 'meme-post-card';
          card.innerHTML = `
            <div class="meme-post-img-box" data-meme-id="${m.id}">
              <img src="/api/memes/${m.id}/image" alt="${m.title}" loading="lazy">
            </div>
            <div class="meme-post-info">
              <h4 class="meme-post-title">${m.title}</h4>
              <div class="meme-post-meta">
                <span>By ${m.nickname}</span>
                <button type="button" class="meme-like-btn ${m.liked ? 'liked' : ''}" data-like-id="${m.id}">
                  <span>${m.liked ? '❤️' : '🤍'}</span> <strong>${m.likes}</strong>
                </button>
              </div>
              ${m.mine ? `<div style="text-align: right;"><button type="button" class="meme-del-btn" data-del-id="${m.id}">删除我的作品 ✕</button></div>` : ''}
            </div>
          `;
          galleryContainer.append(card);
        });
      }

      // 绑定点赞与删除事件
      galleryContainer.querySelectorAll('[data-like-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.likeId;
          const isLiked = btn.classList.contains('liked');
          try {
            const r = await fetch(`/api/memes/${id}/like`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ liked: !isLiked })
            });
            const resData = await r.json();
            if (resData.ok) {
              btn.classList.toggle('liked', resData.liked);
              btn.querySelector('span').textContent = resData.liked ? '❤️' : '🤍';
              btn.querySelector('strong').textContent = resData.likes;
            }
          } catch {}
        });
      });

      galleryContainer.querySelectorAll('[data-del-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('确定要删除这幅梗图吗？')) return;
          const id = btn.dataset.delId;
          try {
            const r = await fetch(`/api/memes/${id}`, { method: 'DELETE' });
            if (r.ok) {
              toast('已删除');
              loadMemesGallery();
            }
          } catch {}
        });
      });

      // 渲染排行榜 Top 3
      if (podiumContainer) {
        podiumContainer.innerHTML = '';
        const ranks = ['🥇', '🥈', '🥉'];
        const rankClasses = ['gold', 'silver', 'bronze'];
        topMemes.slice(0, 3).forEach((m, i) => {
          const p = document.createElement('div');
          p.className = 'podium-card';
          p.innerHTML = `
            <span class="podium-rank ${rankClasses[i]}">${ranks[i]}</span>
            <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 6px;">
              <img src="/api/memes/${m.id}/image" style="width:100%; height:100%; object-fit:cover;" alt="">
            </div>
            <strong style="font-size:13px;">${m.title}</strong>
            <small class="small-note">${m.nickname} · ${m.likes} 赞</small>
          `;
          podiumContainer.append(p);
        });
      }
    } catch {}
  }

  // --------------------------------------------------------------------------
  // 3. 发疯文学逻辑
  // --------------------------------------------------------------------------
  let currentCat = 'programmer';
  function initCrazySection() {
    const quoteEl = document.getElementById('crazy-quote-text');
    const randomBtn = document.getElementById('crazy-random-btn');
    const copyBtn = document.getElementById('crazy-copy-btn');
    const applyMemeBtn = document.getElementById('crazy-apply-meme-btn');
    const catPills = document.querySelectorAll('.crazy-cat-pill');

    function getRandomQuote() {
      const list = crazyQuotes[currentCat] || crazyQuotes.programmer;
      return list[Math.floor(Math.random() * list.length)];
    }

    if (randomBtn && quoteEl) {
      randomBtn.addEventListener('click', () => {
        quoteEl.style.opacity = '0';
        setTimeout(() => {
          quoteEl.textContent = getRandomQuote();
          quoteEl.style.opacity = '1';
        }, 120);
      });
    }

    if (copyBtn && quoteEl) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(quoteEl.textContent).then(() => {
          toast('发疯语录已复制到剪贴板！');
        }).catch(() => toast('复制失败'));
      });
    }

    if (applyMemeBtn && quoteEl) {
      applyMemeBtn.addEventListener('click', () => {
        addTextLayer(quoteEl.textContent.slice(0, 30));
        switchMemeTab('studio');
        toast('已填入梗图画布！');
      });
    }

    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCat = pill.dataset.cat;
        if (quoteEl) quoteEl.textContent = getRandomQuote();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. 人话翻译器逻辑
  // --------------------------------------------------------------------------
  function initTranslator() {
    const inputArea = document.getElementById('trans-input');
    const outputArea = document.getElementById('trans-output');
    const swapBtn = document.getElementById('trans-swap-btn');
    const modeBadge = document.getElementById('trans-mode-badge');
    const chips = document.querySelectorAll('.trans-chip');
    let mode = 'toHuman'; // 'toHuman' | 'toJargon'

    function translate() {
      if (!inputArea || !outputArea) return;
      let text = inputArea.value.trim();
      if (!text) {
        outputArea.textContent = '翻译结果将显示在这里…';
        return;
      }

      if (mode === 'toHuman') {
        jargonDict.forEach(item => {
          text = text.replaceAll(item.jargon, `【${item.human}】`);
        });
        outputArea.textContent = text;
      } else {
        jargonDict.forEach(item => {
          text = text.replaceAll(item.human, `【${item.jargon}】`);
        });
        outputArea.textContent = text;
      }
    }

    if (inputArea) inputArea.addEventListener('input', translate);

    if (swapBtn && modeBadge) {
      swapBtn.addEventListener('click', () => {
        mode = mode === 'toHuman' ? 'toJargon' : 'toHuman';
        modeBadge.textContent = mode === 'toHuman' ? '大厂黑话 ➔ 大白话' : '大白话 ➔ 互联网黑话';
        translate();
      });
    }

    chips.forEach(c => {
      c.addEventListener('click', () => {
        if (inputArea) {
          inputArea.value = c.textContent;
          translate();
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. 标签切换
  // --------------------------------------------------------------------------
  function switchMemeTab(tabKey) {
    $$('.meme-tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tabKey;
      btn.classList.toggle('active', active);
    });
    $$('.meme-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `meme-panel-${tabKey}`);
    });
    if (tabKey === 'gallery' || tabKey === 'battle') {
      loadMemesGallery();
    } else if (tabKey === 'studio') {
      fitCanvasContainer();
      renderCanvas();
    }
  }

  // --------------------------------------------------------------------------
  // 初始化绑定
  // --------------------------------------------------------------------------
  function initMemeLab() {
    initCanvas();
    fitCanvasContainer();
    window.addEventListener('resize', fitCanvasContainer);
    const container = document.getElementById('canvas-container');
    if (window.ResizeObserver && container) {
      new ResizeObserver(() => fitCanvasContainer()).observe(container);
    }
    initCrazySection();
    initTranslator();

    // 绑定标签切换
    $$('.meme-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchMemeTab(btn.dataset.tab);
      });
    });

    // 绑定工具栏按钮
    $('#meme-add-text-btn')?.addEventListener('click', () => addTextLayer('新文字'));
    $('#meme-undo-btn')?.addEventListener('click', undo);
    $('#meme-redo-btn')?.addEventListener('click', redo);
    $('#meme-download-btn')?.addEventListener('click', downloadMemePng);
    $('#meme-publish-btn')?.addEventListener('click', publishMeme);
    $('#meme-delete-layer-btn')?.addEventListener('click', deleteSelectedLayer);

    // 文字内容实时输入
    $('#meme-text-input')?.addEventListener('input', e => {
      if (selectedLayerIndex > 0 && layers[selectedLayerIndex].type === 'text') {
        layers[selectedLayerIndex].text = e.target.value;
        renderCanvas();
      }
    });

    // 文字字号滑块
    $('#meme-size-slider')?.addEventListener('input', e => {
      if (selectedLayerIndex > 0) {
        const cur = layers[selectedLayerIndex];
        if (cur.type === 'text') cur.fontSize = Number(e.target.value);
        if (cur.type === 'sticker') cur.size = Number(e.target.value);
        renderCanvas();
      }
    });

    // 快捷颜色色块
    $$('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        $$('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        if (selectedLayerIndex > 0 && layers[selectedLayerIndex].type === 'text') {
          layers[selectedLayerIndex].color = swatch.dataset.color;
          renderCanvas();
          saveHistory();
        }
      });
    });

    // 快捷贴纸
    $$('.sticker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addStickerLayer(btn.textContent.trim());
      });
    });

    // 快捷底图模板
    $$('.template-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.template-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const kind = chip.dataset.kind;
        layers[0] = {
          type: 'bg',
          kind: kind,
          color: kind === 'bsod' ? '#0055aa' : kind === 'cert' ? '#fff8e7' : '#FFFFFF'
        };
        renderCanvas();
        saveHistory();
      });
    });

    // 自定义上传底图
    $('#meme-custom-upload')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          layers[0] = {
            type: 'bg',
            customImg: img
          };
          renderCanvas();
          saveHistory();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    loadMemesGallery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMemeLab);
  } else {
    initMemeLab();
  }
})();
