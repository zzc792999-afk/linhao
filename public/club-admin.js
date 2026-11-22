'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const panel = $('admin-panel');
  if (!panel) return;
  const views = [...panel.querySelectorAll('[data-admin-view]')];
  const form = $('work-week-form');
  const status = $('work-week-status');
  const filters = [...panel.querySelectorAll('[data-review-status]')];
  const date = new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',timeZone:'Asia/Shanghai'});
  let ready = false, topic, queue;
  let dirty = false, writing = false, readController, filter = 'pending', page = 0;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function announce(message) {
    status.textContent = message;
    $('admin-status').textContent = message;
  }
  function showView(key, {focus,open,move = false} = {}) {
    const selected = views.find(view => view.dataset.adminView === key) || views[0];
    for (const view of views) view.hidden = view !== selected;
    for (const item of panel.querySelectorAll('.work-nav [data-admin-go]')) {
      if (item.dataset.adminGo === selected.dataset.adminView) item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
    if (history.replaceState) history.replaceState(null,'','#' + selected.id);
    const detail = open && $(open);
    if (detail) detail.open = true;
    if (move) {
      const target = focus && $(focus) || detail?.querySelector('summary') || selected.querySelector('h2');
      requestAnimationFrame(() => target?.focus());
    }
  }

  async function request(path = '', method = 'GET', body, signal = AbortSignal.timeout(20000)) {
    const response = await fetch('/api/admin/weekly' + path,{
      method,credentials:'same-origin',signal,
      ...(body === undefined ? {} : {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new Event('class-admin-session-ended'));
      throw Object.assign(Error(data.error || '工作台暂时连不上，请稍后刷新'),{status:response.status});
    }
    return data;
  }
  function drawTopic(next) {
    topic = next;
    $('work-week-period').textContent = date.format(new Date(next.week)) + ' 当周 · ' +
      (next.closed ? '已停止接收回答' : '正在接受回答');
    $('work-week-question').value = next.question;
    $('work-week-goal').value = next.goal;
    $('work-week-closed').checked = next.closed;
    $('work-week-save').disabled = false;
  }
  function drawOverview(data) {
    $('work-pending-weekly').textContent = data.totals.pending;
    $('work-pending-suggestions').textContent = data.pulse.suggestions;
    $('work-today-notes').textContent = data.pulse.notes;
    const badge = $('work-nav-pending');
    badge.hidden = !data.totals.pending;
    badge.textContent = data.totals.pending;
  }
  function reviewButton(label, entry, next) {
    const button = element('button',label,next === 'published' ? 'club-primary' : 'club-quiet');
    button.type = 'button';
    button.addEventListener('click',async () => {
      if (writing) return;
      writing = true;
      button.disabled = true;
      readController?.abort();
      let message;
      try {
        await request('/entry/' + entry.id,'PUT',{status:next,version:entry.version});
        message = next === 'published' ? '回答已公开。' : '回答已隐藏。';
      } catch(error) {
        message = error.message;
      } finally {
        writing = false;
        button.disabled = false;
      }
      if (ready) {
        await load();
        announce(message);
      }
    });
    return button;
  }
  function drawQueue(data) {
    queue = data;
    page = data.page;
    for (const button of filters) {
      const key = button.dataset.reviewStatus;
      button.setAttribute('aria-pressed',String(key === data.status));
      button.querySelector('[data-review-count]').textContent = data.totals[key];
    }
    const rows = data.entries.map(entry => {
      const row = element('article',undefined,'work-review-note');
      const head = element('div',undefined,'work-review-head');
      head.append(element('strong',entry.nickname),element('small',date.format(new Date(entry.week)) + ' 当周'));
      row.append(head,element('p',entry.body));
      const actions = element('div',undefined,'work-actions');
      if (entry.status !== 'published') actions.append(reviewButton('审核通过',entry,'published'));
      if (entry.status !== 'hidden') actions.append(reviewButton('隐藏回答',entry,'hidden'));
      row.append(actions);
      return row;
    });
    const empty = {pending:'目前没有待审核的回答。',published:'还没有公开回答。',hidden:'目前没有被隐藏的回答。'};
    $('work-week-queue').replaceChildren(...(rows.length ? rows : [element('p',empty[data.status],'club-empty')]));
    $('work-review-pages').hidden = data.totals[data.status] <= 20 && page === 0;
    $('work-review-prev').disabled = page === 0;
    $('work-review-next').disabled = (page + 1) * 20 >= data.totals[data.status];
    $('work-review-page').textContent = '第 ' + (page + 1) + ' 页';
  }
  async function load() {
    if (!ready || writing) return;
    readController?.abort();
    const controller = new AbortController();
    readController = controller;
    const signal = AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);
    try {
      const path = '?status=' + filter + '&page=';
      let data = await request(path + page,'GET',undefined,signal);
      if (page && !data.entries.length) {
        page = Math.max(0,Math.ceil(data.totals[filter] / 20) - 1);
        data = await request(path + page,'GET',undefined,signal);
      }
      if (controller.signal.aborted || !ready) return;
      if (!dirty) drawTopic(data.topic);
      else if (data.topic.version !== topic?.version || data.topic.week !== topic?.week) {
        status.textContent = '线上话题已更新。重新载入后再编辑，避免覆盖他人的修改。';
      }
      drawOverview(data);
      drawQueue(data);
    } catch(error) {
      if (!controller.signal.aborted && ready) announce(error.message);
    } finally {
      if (readController === controller) readController = null;
    }
  }
  panel.addEventListener('click',event => {
    const button = event.target.closest('[data-admin-go]');
    if (!button) return;
    showView(button.dataset.adminGo,{focus:button.dataset.adminFocus,open:button.dataset.adminOpen,move:true});
    if (button.hasAttribute('data-weekly-pending') && !writing) {
      filter = 'pending'; page = 0; load();
    } else if (button.dataset.adminGo === 'weekly' && !queue) {
      load();
    }
  });
  filters.forEach(button => button.addEventListener('click',() => {
    if (writing) return;
    filter = button.dataset.reviewStatus; page = 0; load();
  }));
  $('work-week-refresh').addEventListener('click',load);
  $('work-review-prev').addEventListener('click',() => { if(!writing){page = Math.max(0,page - 1); load();} });
  $('work-review-next').addEventListener('click',() => { if(!writing){page++; load();} });
  $('work-week-reset').addEventListener('click',() => {
    if (writing || (dirty && !confirm('放弃未保存的话题修改并重新载入？'))) return;
    dirty = false; status.textContent = ''; load();
  });
  form.addEventListener('input',() => { dirty = true; });
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (!topic || writing) return;
    readController?.abort();
    writing = true;
    const button = $('work-week-save');
    const payload = {week:topic.week,version:topic.version,question:$('work-week-question').value,
      goal:$('work-week-goal').valueAsNumber,closed:$('work-week-closed').checked};
    const controls = [...form.elements];
    controls.forEach(control => { control.disabled = true; });
    let message;
    try {
      const result = await request('/topic','PUT',payload);
      dirty = false;
      drawTopic(result.topic);
      message = '本周话题已保存，同学刷新页面后即可看到。';
    } catch(error) {
      message = error.message;
    } finally {
      controls.forEach(control => { control.disabled = false; });
      button.disabled = !topic;
      writing = false;
    }
    if (ready) announce(message);
  });
  window.addEventListener('class-admin-ready',() => {
    if (!ready) showView(location.hash.match(/^#work-([a-z]+)$/)?.[1]);
    ready = true;
    load();
  });
  window.addEventListener('class-admin-logout',() => {
    ready = false; dirty = false; topic = null; queue = null;
    filter = 'pending'; page = 0;
    readController?.abort();
    form.reset();
    $('work-week-save').disabled = true;
    $('work-week-queue').replaceChildren();
    status.textContent = '';
  });
})();
