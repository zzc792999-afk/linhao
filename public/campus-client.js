'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };

  const preview = document.body.dataset.mode === 'preview';

  // --------------------------------------------------------------------------
  // 通用 API 请求
  // --------------------------------------------------------------------------
  async function api(route, method = 'GET', body, headers = {}) {
    if (preview && method !== 'GET') {
      throw Error('静态展示模式下仅可浏览；互动请在班级正式网址中使用。');
    }
    const isBuffer = body instanceof Blob || body instanceof ArrayBuffer;
    const isForm = body instanceof FormData;
    const defaultHeaders = (!isBuffer && !isForm && body !== undefined)
      ? { 'Content-Type': 'application/json' }
      : {};

    const res = await fetch('/api' + route, {
      method,
      credentials: 'same-origin',
      headers: { ...defaultHeaders, ...headers },
      body: (!isBuffer && !isForm && body !== undefined) ? JSON.stringify(body) : body
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(Error(data.error || '请求未能完成，请稍后重试'), { status: res.status });
    }
    return data;
  }

  function showToast(text) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = text;
    toast.className = 'toast show';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'toast';
    }, 2800);
  }

  // ==========================================================================
  // 1. 网站滚动墙 (Marquee Ticker)
  // ==========================================================================
  async function initMarquee() {
    const track = $('#campus-ticker-track');
    if (!track) return;

    try {
      const data = await api('/marquee');
      const messages = data.messages || [];
      if (!messages.length) {
        messages.push({
          id: 'def-1',
          badge: '广播',
          author: '25计算机1',
          text: '青春同行，代码同窗 · 欢迎来到 25计算机1 班级互动小站！'
        });
      }

      // 循环双倍渲染以保证 CSS 跑马灯平滑无缝衔接
      const itemsToRender = [...messages, ...messages];
      track.replaceChildren(...itemsToRender.map(m => {
        const item = el('div', undefined, 'campus-ticker-item');
        const badge = el('span', m.badge || '广播', 'campus-ticker-badge');
        const text = el('span', m.text, 'campus-ticker-text');
        const author = el('span', '— ' + (m.author || '班委'), 'campus-ticker-author');
        const sep = el('span', '✳', 'campus-ticker-sep');
        item.append(badge, text, author, sep);
        return item;
      }));
    } catch {
      // 容错保持现有静态展示
    }
  }

  // ==========================================================================
  // 2. 老师匿名评价基地 (Teachers Base & Anonymous Reviews)
  // ==========================================================================
  let currentTeacherId = null;
  let activeStarRating = 5;
  let activeQuickTag = '';

  const presetTags = [
    '讲解透彻', '考试划重点', '给分超好', '幽默风趣',
    '作业硬核', '答疑耐心', '课件工整', '收获满满'
  ];

  async function loadTeachers() {
    const grid = $('#teachers-grid');
    if (!grid) return;

    try {
      const data = await api('/teachers');
      const teachers = data.teachers || [];
      if (!teachers.length) {
        grid.replaceChildren(el('p', '暂无老师信息，管理员可在后台添加。', 'small-note'));
        return;
      }

      grid.replaceChildren(...teachers.map(t => {
        const card = el('article', undefined, 'teacher-card');
        card.dataset.teacherId = t.id;

        const header = el('div', undefined, 'teacher-header');
        const avatar = el('div', t.avatar || '👨‍🏫', 'teacher-avatar');
        const info = el('div', undefined, 'teacher-info');
        const name = el('h3', t.name);
        const subject = el('p', t.subject || '任课老师', 'teacher-subject');
        info.append(name, subject);
        header.append(avatar, info);

        const ratingBar = el('div', undefined, 'teacher-rating-bar');
        const avg = Number(t.avg_rating || 5).toFixed(1);
        const starsCount = Math.round(avg);
        const stars = el('span', '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount), 'stars-display');
        const score = el('span', avg + ' 分', 'teacher-score');
        const count = el('span', `(${t.review_count || 0} 条评价)`, 'teacher-review-count');
        ratingBar.append(stars, score, count);

        // 标签云
        const tagCloud = el('div', undefined, 'teacher-tags-cloud');
        const tags = (t.tags || []).slice(0, 4);
        if (tags.length) {
          tags.forEach(tag => {
            tagCloud.append(el('span', `🏷 ${tag}`, 'teacher-tag-chip'));
          });
        } else {
          tagCloud.append(el('span', '暂无标签 · 等你首评', 'teacher-tag-chip'));
        }

        const actions = el('div', undefined, 'teacher-actions');
        const viewBtn = el('button', '查看评价 & 匿名评教 ↗', 'button');
        viewBtn.type = 'button';
        viewBtn.addEventListener('click', () => openTeacherReviews(t));
        actions.append(viewBtn);

        card.append(header, ratingBar, tagCloud, actions);
        return card;
      }));
    } catch (e) {
      grid.replaceChildren(el('p', '老师列表加载失败：' + e.message, 'small-note'));
    }
  }

  async function openTeacherReviews(teacher) {
    currentTeacherId = teacher.id;
    const drawer = $('#teacher-reviews-drawer');
    if (!drawer) return;
    drawer.hidden = false;
    $('#reviews-drawer-title').textContent = `${teacher.name}（${teacher.subject}）· 匿名评价区`;
    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    await loadTeacherReviews(teacher.id);
  }

  async function loadTeacherReviews(teacherId) {
    const list = $('#review-items-list');
    if (!list) return;
    list.replaceChildren(el('p', '正在加载评价…', 'small-note'));

    try {
      const data = await api(`/teachers/${teacherId}/reviews`);
      const reviews = data.reviews || [];

      if (!reviews.length) {
        list.replaceChildren(el('p', '该老师暂无同学评价，快来抢首评吧！', 'small-note'));
        return;
      }

      list.replaceChildren(...reviews.map(r => {
        const item = el('div', undefined, 'review-item');

        const head = el('div', undefined, 'review-item-header');
        const moniker = el('span', r.nickname || '匿名同学', 'review-moniker');
        const stars = el('span', '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating), 'stars-display');
        head.append(moniker, stars);

        if (r.tag) {
          const tag = el('span', r.tag, 'review-tag-badge');
          head.append(tag);
        }

        const comment = el('p', r.content, 'review-comment');

        const footer = el('div', undefined, 'review-footer');
        const dateStr = new Date(r.date).toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const time = el('span', dateStr);
        footer.append(time);

        if (r.mine) {
          const delBtn = el('button', '删除我的评价', 'review-delete-btn');
          delBtn.type = 'button';
          delBtn.addEventListener('click', async () => {
            if (!confirm('确定删除你发布的这条评价吗？')) return;
            try {
              await api(`/teachers/reviews/${r.id}`, 'DELETE');
              showToast('评价已删除');
              await loadTeacherReviews(teacherId);
              await loadTeachers();
            } catch (err) {
              alert(err.message);
            }
          });
          footer.append(delBtn);
        }

        item.append(head, comment, footer);
        return item;
      }));
    } catch (e) {
      list.replaceChildren(el('p', '评价加载失败：' + e.message, 'small-note'));
    }
  }

  function setupTeacherForm() {
    const starPicker = $('#review-star-picker');
    if (starPicker) {
      const stars = starPicker.querySelectorAll('span');
      stars.forEach((s, idx) => {
        s.addEventListener('click', () => {
          activeStarRating = idx + 1;
          stars.forEach((st, i) => st.classList.toggle('active', i < activeStarRating));
        });
      });
    }

    const tagContainer = $('#quick-tag-selector');
    if (tagContainer) {
      tagContainer.replaceChildren(...presetTags.map(tag => {
        const btn = el('button', tag, 'quick-tag-btn');
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (activeQuickTag === tag) {
            activeQuickTag = '';
            btn.classList.remove('active');
          } else {
            activeQuickTag = tag;
            tagContainer.querySelectorAll('.quick-tag-btn').forEach(b => b.classList.toggle('active', b === btn));
          }
        });
        return btn;
      }));
    }

    const form = $('#teacher-review-form');
    if (form) {
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!currentTeacherId) return;

        const nickname = $('#review-nickname').value.trim() || '匿名同学';
        const content = $('#review-content').value.trim();
        if (!content) {
          alert('请写下你的评价内容');
          return;
        }

        const submitBtn = $('#review-submit-btn');
        submitBtn.disabled = true;

        try {
          await api(`/teachers/${currentTeacherId}/reviews`, 'POST', {
            nickname,
            rating: activeStarRating,
            tag: activeQuickTag,
            content
          });
          showToast('匿名评价已提交！');
          $('#review-content').value = '';
          await loadTeacherReviews(currentTeacherId);
          await loadTeachers();
        } catch (err) {
          alert(err.message);
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    $('#close-reviews-drawer')?.addEventListener('click', () => {
      const drawer = $('#teacher-reviews-drawer');
      if (drawer) drawer.hidden = true;
      currentTeacherId = null;
    });
  }

  // ==========================================================================
  // 3. 趣味扔物靶场 (Throwing Target Arena)
  // ==========================================================================
  const throwItems = {
    egg: { emoji: '🥚', name: '鸡蛋', splat: '🍳' },
    slipper: { emoji: '🩴', name: '拖鞋', splat: '🩴' },
    tomato: { emoji: '🍅', name: '烂番茄', splat: '💥' },
    veggie: { emoji: '🥦', name: '蔬菜', splat: '🥬' },
    brick: { emoji: '🧱', name: '板砖', splat: '🧱' },
    flower: { emoji: '💐', name: '鲜花', splat: '🌸' }
  };

  let currentTargetId = null;
  let currentTargetData = null;
  let selectedItem = 'egg';

  async function loadTargets() {
    const gallery = $('#targets-gallery');
    if (!gallery) return;

    try {
      const data = await api('/targets');
      const targets = data.targets || [];

      if (!targets.length) {
        gallery.replaceChildren(el('p', '靶场暂无图片，点击上方「上传新靶子」来一张吧！', 'small-note'));
        $('#arena-target-box')?.classList.add('hidden');
        $('#arena-stage-title').textContent = '等待上传靶子…';
        return;
      }

      gallery.replaceChildren(...targets.map(t => {
        const card = el('div', undefined, 'target-thumb-card' + (t.id === currentTargetId ? ' active' : ''));
        card.dataset.targetId = t.id;

        const img = el('img', undefined, 'target-thumb-img');
        img.src = `/api/targets/${t.id}/image`;
        img.alt = t.title;
        img.loading = 'lazy';

        const title = el('div', t.title, 'target-thumb-title');
        const throws = el('div', `命中 ${t.throws_count} 次`, 'target-thumb-throws');

        card.append(img, title, throws);
        card.addEventListener('click', () => selectTarget(t));
        return card;
      }));

      // 如果当前没有选中靶子，或者选中的靶子已被删除，默认选第一个
      if (!currentTargetId || !targets.some(t => t.id === currentTargetId)) {
        selectTarget(targets[0]);
      }
    } catch (e) {
      gallery.replaceChildren(el('p', '靶场加载失败：' + e.message, 'small-note'));
    }
  }

  async function selectTarget(target) {
    currentTargetId = target.id;
    currentTargetData = target;

    // 更新缩略图高亮
    document.querySelectorAll('.target-thumb-card').forEach(c => {
      c.classList.toggle('active', c.dataset.targetId === target.id);
    });

    const box = $('#arena-target-box');
    const img = $('#arena-target-image');
    if (!box || !img) return;

    box.classList.remove('hidden');
    img.src = `/api/targets/${target.id}/image`;
    img.alt = target.title;

    $('#arena-stage-title').textContent = `🎯 正在投掷：${target.title}`;
    const deleteBtn = $('#delete-target-btn');
    if (deleteBtn) {
      deleteBtn.hidden = !target.mine;
    }

    await loadTargetSplats(target.id);
  }

  async function loadTargetSplats(targetId) {
    const box = $('#arena-target-box');
    if (!box) return;

    // 清除旧的留痕标记
    box.querySelectorAll('.splat-marker').forEach(s => s.remove());

    try {
      const data = await api(`/targets/${targetId}/splats`);
      const splats = data.splats || [];
      const itemCounts = data.itemCounts || {};

      splats.forEach(s => renderSplat(s.item, s.x, s.y));
      updateToolbarCounts(itemCounts);
    } catch {
      // 容错
    }
  }

  function renderSplat(itemKey, x, y) {
    const box = $('#arena-target-box');
    if (!box) return;

    const def = throwItems[itemKey] || throwItems.egg;
    const marker = el('span', def.splat, 'splat-marker');
    marker.style.left = `${(x * 100).toFixed(2)}%`;
    marker.style.top = `${(y * 100).toFixed(2)}%`;
    box.append(marker);
  }

  function updateToolbarCounts(itemCounts = {}) {
    for (const [key, def] of Object.entries(throwItems)) {
      const countSpan = $(`[data-throw-count="${key}"]`);
      if (countSpan) {
        countSpan.textContent = itemCounts[key] || 0;
      }
    }
  }

  function playThrowAnimation(startX, startY, targetX, targetY, itemKey, onHit) {
    const projectile = el('div', throwItems[itemKey]?.emoji || '🥚', 'flying-projectile');
    projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY}px`;
    document.body.append(projectile);

    // 强制回流以触发 CSS transition
    void projectile.offsetWidth;

    projectile.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(1.4) rotate(720deg)`;

    setTimeout(() => {
      projectile.style.opacity = '0';
      onHit?.();
      setTimeout(() => projectile.remove(), 200);
    }, 320);
  }

  function setupTargetArena() {
    const box = $('#arena-target-box');
    const img = $('#arena-target-image');

    if (box && img) {
      box.addEventListener('click', async event => {
        if (!currentTargetId) return;

        const rect = img.getBoundingClientRect();
        const clientX = event.clientX;
        const clientY = event.clientY;

        // 确保点击在图片有效范围内
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          return;
        }

        const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

        // 弹道动画起点：道具工具栏或屏幕下方
        const activeBtn = $(`.throw-item-btn[data-item="${selectedItem}"]`);
        const btnRect = activeBtn?.getBoundingClientRect();
        const startX = btnRect ? btnRect.left + btnRect.width / 2 : clientX;
        const startY = btnRect ? btnRect.top : window.innerHeight - 50;

        playThrowAnimation(startX, startY, clientX, clientY, selectedItem, () => {
          renderSplat(selectedItem, normX, normY);
          // 震动特效
          box.classList.add('pet-feed-pop');
          setTimeout(() => box.classList.remove('pet-feed-pop'), 400);
        });

        try {
          const res = await api(`/targets/${currentTargetId}/throw`, 'POST', {
            item: selectedItem,
            x: normX,
            y: normY
          });
          updateToolbarCounts(res.itemCounts);
        } catch (e) {
          showToast(e.message);
        }
      });
    }

    // 道具工具栏切换
    const toolbar = $('#throw-toolbar');
    if (toolbar) {
      toolbar.querySelectorAll('.throw-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedItem = btn.dataset.item;
          toolbar.querySelectorAll('.throw-item-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
      });
    }

    // 上传新靶子
    const uploadBtn = $('#target-upload-toggle');
    const uploadForm = $('#target-upload-form');
    if (uploadBtn && uploadForm) {
      uploadBtn.addEventListener('click', () => {
        uploadForm.hidden = !uploadForm.hidden;
      });
    }

    const realUploadForm = $('#target-real-form');
    if (realUploadForm) {
      realUploadForm.addEventListener('submit', async event => {
        event.preventDefault();
        const fileInput = $('#target-file-input');
        const titleInput = $('#target-title-input');
        const file = fileInput?.files?.[0];
        const title = titleInput?.value.trim() || '班级解压靶子';

        if (!file) {
          alert('请选择一张图片上传');
          return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert('请上传 JPG、PNG 或 WebP 格式图片');
          return;
        }
        if (file.size > 8 * 1024 * 1024) {
          alert('图片过大，请上传小于 8MB 的图片');
          return;
        }

        const submitBtn = $('#target-upload-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '正在上传与优化…';

        try {
          const res = await api('/targets?title=' + encodeURIComponent(title), 'POST', file, {
            'Content-Type': file.type
          });
          showToast('新靶子已挂上！全班可以开始投掷啦！');
          uploadForm.hidden = true;
          fileInput.value = '';
          titleInput.value = '';
          await loadTargets();
          if (res.id) {
            const found = res.targets?.find(t => t.id === res.id);
            if (found) selectTarget(found);
          }
        } catch (err) {
          alert(err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '上传到靶场 🎯';
        }
      });
    }

    // 删除当前靶子
    $('#delete-target-btn')?.addEventListener('click', async () => {
      if (!currentTargetId) return;
      if (!confirm('确定删除这张靶子图片吗？全班将无法再向它投掷。')) return;

      try {
        await api(`/targets/${currentTargetId}`, 'DELETE');
        showToast('靶子已删除');
        currentTargetId = null;
        await loadTargets();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ==========================================================================
  // 初始化与监听
  // ==========================================================================
  function init() {
    initMarquee();
    loadTeachers();
    setupTeacherForm();
    loadTargets();
    setupTargetArena();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
