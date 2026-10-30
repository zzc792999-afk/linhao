'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  };

  async function adminApi(route, method = 'GET', body) {
    const res = await fetch('/api/admin/campus' + route, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(Error(data.error || '操作失败'), { status: res.status });
    }
    return data;
  }

  // ==========================================================================
  // 1. 网站滚动墙管理 (Marquee Broadcaster)
  // ==========================================================================
  async function refreshMarquee() {
    const list = $('#manage-marquee-list');
    if (!list) return;

    try {
      const data = await adminApi('');
      const messages = data.marquee || [];

      if (!messages.length) {
        list.replaceChildren(el('p', '暂无滚动墙消息。在上方发送一条消息即可在首页滚动展示。', 'small-note'));
        return;
      }

      list.replaceChildren(...messages.map(m => {
        const row = el('div', undefined, 'admin-row');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '10px 14px';
        row.style.margin = '6px 0';
        row.style.border = '1px solid var(--line)';
        row.style.borderRadius = '8px';
        row.style.background = 'var(--paper)';

        const textCol = el('div');
        const badge = el('span', `[${m.badge || '广播'}] `, 'small-note');
        badge.style.color = 'var(--lime)';
        badge.style.fontWeight = 'bold';
        const content = el('strong', m.text);
        const meta = el('span', ` — 发布人: ${m.author || '班委'} · ${new Date(m.date).toLocaleDateString('zh-CN')}`, 'small-note');
        textCol.append(badge, content, meta);

        const delBtn = el('button', '删除', 'button secondary');
        delBtn.type = 'button';
        delBtn.style.padding = '4px 10px';
        delBtn.style.fontSize = '12px';
        delBtn.addEventListener('click', async () => {
          if (!confirm(`确定删除滚动墙消息「${m.text}」？`)) return;
          try {
            await adminApi(`/marquee/${m.id}`, 'DELETE');
            await refreshMarquee();
          } catch (e) {
            alert(e.message);
          }
        });

        row.append(textCol, delBtn);
        return row;
      }));
    } catch {
      // 登录状态由主后台负责
    }
  }

  function setupMarqueeForm() {
    const form = $('#marquee-form');
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const text = $('#marquee-text').value.trim();
      const author = $('#marquee-author').value.trim() || '班委';
      if (!text) return;

      const submitBtn = $('#marquee-submit');
      submitBtn.disabled = true;

      try {
        await adminApi('/marquee', 'POST', { text, author });
        $('#marquee-text').value = '';
        await refreshMarquee();
      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================================================
  // 2. 评教基地管理 (Teachers & Anonymous Reviews Moderation)
  // ==========================================================================
  async function refreshTeachers() {
    const list = $('#manage-teachers-list');
    const reviewsList = $('#manage-teacher-reviews-list');
    if (!list) return;

    try {
      const data = await adminApi('');
      const teachers = data.teachers || [];
      const reviews = data.reviews || [];

      // 渲染老师列表
      if (!teachers.length) {
        list.replaceChildren(el('p', '暂无评教老师，请在上方添加。', 'small-note'));
      } else {
        list.replaceChildren(...teachers.map(t => {
          const row = el('div', undefined, 'admin-row');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '10px 14px';
          row.style.margin = '6px 0';
          row.style.border = '1px solid var(--line)';
          row.style.borderRadius = '8px';
          row.style.background = 'var(--paper)';

          const info = el('div');
          const name = el('strong', `${t.name} `);
          const sub = el('span', `(${t.subject || '任课老师'}) · 评分: ${t.avg_rating || 5}分 · ${t.review_count || 0}条评价`, 'small-note');
          info.append(name, sub);

          const delBtn = el('button', '删除老师', 'button secondary');
          delBtn.type = 'button';
          delBtn.style.padding = '4px 10px';
          delBtn.style.fontSize = '12px';
          delBtn.addEventListener('click', async () => {
            if (!confirm(`确定删除老师「${t.name}」吗？相关评价也会一并删除！`)) return;
            try {
              await adminApi(`/teachers/${t.id}`, 'DELETE');
              await refreshTeachers();
            } catch (e) {
              alert(e.message);
            }
          });

          row.append(info, delBtn);
          return row;
        }));
      }

      // 渲染评价审核列表
      if (reviewsList) {
        if (!reviews.length) {
          reviewsList.replaceChildren(el('p', '暂无同学匿名评价。', 'small-note'));
        } else {
          reviewsList.replaceChildren(...reviews.map(r => {
            const item = el('div', undefined, 'admin-row');
            item.style.padding = '10px 14px';
            item.style.margin = '8px 0';
            item.style.border = '1px solid var(--line)';
            item.style.borderRadius = '8px';
            item.style.background = 'var(--paper)';

            const top = el('div');
            top.style.display = 'flex';
            top.style.justifyContent = 'space-between';
            top.style.alignItems = 'center';

            const meta = el('span', `${r.teacher_name} · ${r.nickname || '匿名同学'} (${'★'.repeat(r.rating)}) · ${r.tag || ''}`, 'small-note');
            const delBtn = el('button', '删除此条违规评价', 'button secondary');
            delBtn.type = 'button';
            delBtn.style.fontSize = '11px';
            delBtn.style.color = '#d9635b';
            delBtn.addEventListener('click', async () => {
              if (!confirm('确定作为管理员删除这条评价？')) return;
              try {
                await adminApi(`/reviews/${r.id}`, 'DELETE');
                await refreshTeachers();
              } catch (e) {
                alert(e.message);
              }
            });

            top.append(meta, delBtn);
            const content = el('p', r.content);
            content.style.margin = '6px 0 2px';
            content.style.fontSize = '13px';
            content.style.lineHeight = '1.6';

            item.append(top, content);
            return item;
          }));
        }
      }
    } catch {
      // 容错
    }
  }

  function setupTeacherAdminForm() {
    const form = $('#admin-add-teacher-form');
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const name = $('#admin-teacher-name').value.trim();
      const subject = $('#admin-teacher-subject').value.trim();
      if (!name) return;

      const submitBtn = $('#admin-teacher-submit');
      submitBtn.disabled = true;

      try {
        await adminApi('/teachers', 'POST', { name, subject });
        $('#admin-teacher-name').value = '';
        $('#admin-teacher-subject').value = '';
        await refreshTeachers();
      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================================================
  // 3. 趣味靶场管理 (Throwing Target Arena Moderation)
  // ==========================================================================
  async function refreshTargets() {
    const list = $('#manage-targets-list');
    if (!list) return;

    try {
      const data = await adminApi('');
      const targets = data.targets || [];

      if (!targets.length) {
        list.replaceChildren(el('p', '暂无上传的靶子图片。', 'small-note'));
        return;
      }

      list.replaceChildren(...targets.map(t => {
        const item = el('div', undefined, 'admin-row');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '14px';
        item.style.padding = '10px 14px';
        item.style.margin = '8px 0';
        item.style.border = '1px solid var(--line)';
        item.style.borderRadius = '8px';
        item.style.background = 'var(--paper)';

        const img = el('img');
        img.src = `/api/targets/${t.id}/image`;
        img.alt = t.title;
        img.style.width = '60px';
        img.style.height = '60px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';

        const info = el('div');
        info.style.flex = '1';
        const title = el('strong', t.title);
        const meta = el('p', `命中次数: ${t.throws_count} 次 · 上传时间: ${new Date(t.date).toLocaleDateString('zh-CN')}`, 'small-note');
        meta.style.margin = '4px 0 0';
        info.append(title, meta);

        const delBtn = el('button', '下架并删除靶子', 'button secondary');
        delBtn.type = 'button';
        delBtn.style.color = '#d9635b';
        delBtn.addEventListener('click', async () => {
          if (!confirm(`确定下架删除靶子「${t.title}」？相关投掷痕迹也将清空。`)) return;
          try {
            await adminApi(`/targets/${t.id}`, 'DELETE');
            await refreshTargets();
          } catch (e) {
            alert(e.message);
          }
        });

        item.append(img, info, delBtn);
        return item;
      }));
    } catch {
      // 容错
    }
  }

  // ==========================================================================
  // 绑定折叠展开事件与刷新
  // ==========================================================================
  function init() {
    setupMarqueeForm();
    setupTeacherAdminForm();

    $('#campus-admin-marquee-fold')?.addEventListener('toggle', e => {
      if (e.target.open) refreshMarquee();
    });
    $('#campus-admin-teachers-fold')?.addEventListener('toggle', e => {
      if (e.target.open) refreshTeachers();
    });
    $('#campus-admin-targets-fold')?.addEventListener('toggle', e => {
      if (e.target.open) refreshTargets();
    });

    // 与全局 refresh-admin 同步
    $('#refresh-admin')?.addEventListener('click', () => {
      refreshMarquee();
      refreshTeachers();
      refreshTargets();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
