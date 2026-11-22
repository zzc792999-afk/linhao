'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const form = $('week-form');
  if (!form) return;
  const live = document.body.dataset.mode === 'live';
  const answer = $('week-answer');
  const nickname = $('week-nickname');
  const status = $('week-status');
  const archiveStatus = $('week-archive-status');
  const chinaDate = new Intl.DateTimeFormat('zh-CN', {
    timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'
  });
  const chinaTime = new Intl.DateTimeFormat('zh-CN', {
    timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  });
  let current, page = 0, busy = false, dirty = false, lastLoadedAt = 0;
  let archiveWeek = '', archivePage = 0, archiveBusy = false, archiveData;

  function create(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function weekLabel(week) {
    const monday = Date.parse(week);
    return chinaDate.format(monday) + '–' + chinaDate.format(monday + 6 * 86400000);
  }

  async function request(path, method = 'GET', body) {
    const response = await fetch('/api/weekly' + path, {
      method, credentials:'same-origin', signal:AbortSignal.timeout(20000),
      ...(body === undefined ? {} : {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(Error(data.error || '手账未连上，请稍后刷新'),{status:response.status});
    return data;
  }

  function drawEntries(target, entries, mine, empty) {
    const cards = entries.map(entry => {
      const card = create('article', undefined, 'club-note');
      const head = create('div', undefined, 'club-note-head');
      const initial = Array.from(entry.nickname)[0] || '同';
      const circle = create('span', initial, 'club-note-avatar');
      circle.setAttribute('aria-hidden','true');
      head.append(circle,create('strong',entry.nickname));
      if (entry.id === mine?.id) head.append(create('small','我的回答','club-note-own'));
      card.append(head,create('p',entry.body));
      return card;
    });
    target.replaceChildren(...(cards.length ? cards : [create('p',empty,'club-empty')]));
  }

  function draw(data) {
    const changedWeek = current && data.topic.week !== current.topic.week;
    current = data;
    page = data.page;
    const {topic,mine,pulse,total} = data;
    $('hero-week-question').textContent = topic.question;
    $('hero-week-detail').textContent = weekLabel(topic.week) + ' · ' + total + ' 条公开回答';
    $('week-range').textContent = weekLabel(topic.week);
    $('week-question').textContent = topic.question;
    $('week-deadline').textContent = topic.closed ? '本周投稿已结束' :
      '北京时间 ' + chinaTime.format(new Date(Date.parse(data.endsAt) - 60000)) + ' 截止';
    $('week-progress').max = topic.goal;
    $('week-progress').value = Math.min(topic.goal,total);
    $('week-goal-text').textContent = total >= topic.goal ?
      '全班已完成本周共创目标 · ' + total + ' 条公开回答' : '共创进度 · ' + total + ' / ' + topic.goal + ' 条公开回答';
    $('week-entry-total').textContent = total + ' 条';
    $('club-pulse-notes').textContent = pulse.notes ? '今日新增 ' + pulse.notes + ' 条' : '看看同学聊什么';
    $('club-pulse-photos').textContent = pulse.photos ? '今日新增 ' + pulse.photos + ' 张' : '打开班级照片墙';
    $('club-pulse-event').textContent = pulse.nextEvent ?
      chinaDate.format(new Date(pulse.nextEvent.start_at)) + ' · ' + pulse.nextEvent.title : '暂无即将开始的活动';
    $('club-pulse-chicks').textContent = pulse.chicks ? '今日孵出 ' + pulse.chicks + ' 只' : '今天还没有小鸡诞生';
    form.hidden = topic.closed;
    $('week-withdraw').hidden = !mine;
    $('week-submit').textContent = mine ? '保存我的修改' : '投递回答';
    if (!dirty) {
      let saved = '';
      try { saved = JSON.parse(localStorage.getItem('class2501-nickname')) || ''; } catch {}
      nickname.value = mine?.nickname || saved;
      answer.value = mine?.body || '';
      updateLength();
    }
    status.textContent = changedWeek && dirty ? '新话题已更新，提交前请检查保留的草稿。' :
      mine?.status === 'pending' ? '你的回答已投递，等待管理员审核。' :
      mine?.status === 'published' ? '你的回答已公开。修改后需要重新审核。' :
      mine?.status === 'hidden' ? '这条回答暂未公开，你可以修改后重新提交。' : '';
    drawEntries($('week-entries'),data.entries,mine,
      topic.closed ? '本周没有公开回答。' : '这页还空着。愿意留下本周的第一句话吗？');
    $('week-pages').hidden = total <= 12 && page === 0;
    $('week-previous').disabled = page === 0;
    $('week-next').disabled = (page + 1) * 12 >= total;
    $('week-page-label').textContent = '第 ' + (page + 1) + ' 页';
  }

  function updateLength() {
    $('week-limit').textContent = answer.value.length + ' / 180';
  }

  async function refresh(target = page, showMessage = false) {
    if (!live || busy || document.hidden) return;
    busy = true;
    $('week-refresh').disabled = true;
    try {
      let data = await request('?page=' + target);
      const pageExpired = current && data.topic.week !== current.topic.week;
      if (target > 0 && (pageExpired || !data.entries.length)) data = await request('?page=0');
      draw(data);
      lastLoadedAt = Date.now();
      if (showMessage && !status.textContent) status.textContent = '已同步最新回答。';
    } catch (error) {
      status.textContent = error.message || '连接暂未恢复，请点刷新重试。';
    } finally {
      $('week-refresh').disabled = false;
      busy = false;
    }
  }

  async function changeAnswer(method) {
    if (!current || busy) return;
    busy = true;
    const controls = [...form.elements, $('week-withdraw')];
    controls.forEach(input => input.disabled = true);
    let expired = false;
    try {
      const data = await request('',method,{week:current.topic.week,nickname:nickname.value,body:answer.value});
      if (method === 'PUT') {
        try { localStorage.setItem('class2501-nickname',JSON.stringify(nickname.value.trim())); } catch {}
      }
      dirty = false;
      draw(data);
      if (method === 'DELETE') status.textContent = '你的回答已撤回。';
    } catch (error) {
      status.textContent = error.message + '。';
      expired = error.status === 409;
    } finally {
      controls.forEach(input => input.disabled = false);
      busy = false;
    }
    if (expired) await refresh(0);
  }

  async function loadArchive(listOnly, targetPage = 0) {
    if (archiveBusy) return;
    archiveBusy = true;
    try {
      if (listOnly) {
        const {weeks} = await request('/archive');
        const links = weeks.map(item => {
          const button = create('button',weekLabel(item.week) + ' · ' + item.question + '（' + item.total + ' 条）','club-archive-link');
          button.type = 'button';
          button.addEventListener('click',() => {
            if (archiveBusy) return;
            archiveWeek = item.week;
            loadArchive(false);
          });
          return button;
        });
        $('week-archive-list').replaceChildren(...(links.length ? links :
          [create('p','还没有往期手账。每周一更新后，上一周的公开回答会归到这里。','club-empty')]));
      } else if (archiveWeek) {
        const data = await request('/archive?week=' + encodeURIComponent(archiveWeek) + '&page=' + targetPage);
        archiveData = data;
        archivePage = data.page;
        $('week-archive-reading').hidden = false;
        $('week-archive-question').textContent = weekLabel(data.topic.week) + ' · ' + data.topic.question;
        drawEntries($('week-archive-entries'),data.entries,data.mine,'此页没有公开回答。');
        $('week-archive-previous').disabled = archivePage === 0;
        $('week-archive-next').disabled = (archivePage + 1) * 12 >= data.total;
        $('week-archive-page').textContent = '第 ' + (archivePage + 1) + ' 页';
        $('week-archive-withdraw').hidden = !data.mine;
      }
      archiveStatus.textContent = '';
    } catch (error) {
      archiveStatus.textContent = error.message;
    } finally {
      archiveBusy = false;
    }
  }

  function applyHenPreference(hidden) {
    document.body.classList.toggle('club-hide-hen',hidden);
    document.body.classList.toggle('hen-resting',hidden);
    $('club-hen-toggle').setAttribute('aria-pressed',String(hidden));
    $('club-hen-toggle').setAttribute('aria-label',hidden ? '显示班级小鸡' : '隐藏班级小鸡');
    $('club-hen-state').textContent = hidden ? '已隐藏' : '显示中';
    window.dispatchEvent(new Event('class-hen-preference'));
  }

  let henHidden = false;
  try { henHidden = localStorage.getItem('class2501-hen-hidden') === 'true'; } catch {}
  applyHenPreference(henHidden);
  $('club-hen-toggle').addEventListener('click',() => {
    henHidden = !henHidden;
    applyHenPreference(henHidden);
    try { localStorage.setItem('class2501-hen-hidden',String(henHidden)); } catch {}
  });

  if (!live) {
    status.textContent = '这是展示页，请前往正式站参与班级手账。';
    $('week-refresh').disabled = true;
    return;
  }
  form.addEventListener('input',() => { dirty = true; updateLength(); });
  form.addEventListener('submit',event => { event.preventDefault(); changeAnswer('PUT'); });
  $('week-withdraw').addEventListener('click',() => {
    if (confirm('撤回后，这条回答将从手账移除。确定撤回？')) changeAnswer('DELETE');
  });
  $('week-refresh').addEventListener('click',() => refresh(page,true));
  $('week-previous').addEventListener('click',() => refresh(Math.max(0,page - 1)));
  $('week-next').addEventListener('click',() => refresh(page + 1));
  $('week-archive').addEventListener('toggle',() => {
    if ($('week-archive').open) loadArchive(true);
  });
  $('week-archive-previous').addEventListener('click',() => loadArchive(false,Math.max(0,archivePage - 1)));
  $('week-archive-next').addEventListener('click',() => loadArchive(false,archivePage + 1));
  $('week-archive-withdraw').addEventListener('click',async () => {
    if (archiveBusy || !archiveData?.mine || !confirm('确定撤回这条往期回答？')) return;
    archiveBusy = true;
    try {
      await request('','DELETE',{week:archiveData.topic.week});
      archiveBusy = false;
      await loadArchive(false,0);
      await loadArchive(true);
      archiveStatus.textContent = '往期回答已撤回。';
    } catch(error) {
      archiveStatus.textContent = error.message;
    } finally {
      archiveBusy = false;
    }
  });
  const refreshWhenDue = () => {
    if (Date.now() - lastLoadedAt > 60000) refresh();
  };
  window.addEventListener('class-synced',refreshWhenDue);
  window.addEventListener('online',refreshWhenDue);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) refreshWhenDue(); });
  if (typeof classReady !== 'undefined' && classReady) refreshWhenDue();
  else setTimeout(refreshWhenDue,5000);
})();
