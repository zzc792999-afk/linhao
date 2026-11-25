'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const publicPage = $('duty-page');
  const admin = $('duty-admin-fold');
  if (!publicPage && !admin) return;

  const labels = {pending:'待审批',approved:'已同意',rejected:'已驳回'};
  const chinaTime = new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const node = (tag,text,className) => {
    const element=document.createElement(tag);
    if(text!==undefined) element.textContent=text;
    if(className) element.className=className;
    return element;
  };
  const title = ([group]) => group<8 ? '单人第 '+(group+1)+' 组' : '双人第 '+(group-7)+' 组';
  const side = person => person.name+'（'+title(person.position)+'）';
  async function request(path,method='GET',body) {
    const response=await fetch(path,{method,credentials:'same-origin',signal:AbortSignal.timeout(18000),
      ...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    const data=await response.json().catch(()=>({}));
    if(admin && response.status===401) window.dispatchEvent(new Event('class-admin-session-ended'));
    if(!response.ok) throw Object.assign(Error(data.error || '连接失败，请重试'),{status:response.status});
    return data;
  }
  function card(item){
    const row=node('article',undefined,'duty-request');
    const badge=node('span',labels[item.status],'duty-tag');
    badge.dataset.state=item.status;
    row.append(badge,node('p',side(item.from)+' ⇄ '+side(item.to)),node('p','提交于 '+chinaTime.format(new Date(item.date)),'duty-help'),node('p',item.reason));
    if(item.note) row.append(node('p','审批备注 · '+item.note,'duty-help'));
    return row;
  }

  if(publicPage){
    const form=$('duty-form'), fields=$('duty-fields'), from=$('duty-from'), to=$('duty-to');
    const status=$('duty-form-status'), loadStatus=$('duty-load-status'), retry=$('duty-retry'), refresh=$('duty-refresh');
    let state,busy=false;
    function member(select){
      if(!select.value) return null;
      const position=select.value.split(',').map(Number);
      return {position,name:state.groups[position[0]][position[1]]};
    }
    function options(select,exclude){
      const old=select.value;
      const oldText=select.selectedOptions[0]?.textContent;
      const placeholder=node('option','请选择姓名');
      placeholder.value='';
      select.replaceChildren(placeholder);
      const solo=node('optgroup'), pairs=node('optgroup');
      solo.label='单人值日'; pairs.label='双人值日';
      state.groups.forEach((group,i)=>{
        if(i===exclude)return;
        group.forEach((name,j)=>{
          const option=node('option',name+' · '+title([i]));
          option.value=[i,j].join(',');
          (i<8?solo:pairs).append(option);
        });
      });
      select.append(solo,pairs);
      if([...select.options].some(option=>option.value===old && option.textContent===oldText)) select.value=old;
    }
    function preview(){
      const first=member(from), second=member(to), hint=$('duty-preview');
      hint.hidden=!(first&&second);
      if(first&&second){
        const describe=(student,target)=>{
          const partner=state.groups[target.position[0]][1-target.position[1]];
          return student.name+'去'+title(target.position)+(partner?'，和'+partner+'一起值日':'');
        };
        hint.textContent=describe(first,second)+'。'+describe(second,first)+'。';
      }
    }
    function draw(){
      const rows=groups=>groups.map(group=>{
        const row=node('li');
        row.append(...group.map(name=>node('span',name)));
        return row;
      });
      $('duty-solo').replaceChildren(...rows(state.groups.slice(0,8)));
      $('duty-pairs').replaceChildren(...rows(state.groups.slice(8)));
      options(from);
      options(to,member(from)?.position[0]);
      preview();
      const mine=$('duty-mine');
      mine.replaceChildren(...(state.requests.length?state.requests.map(card):[node('p','这个浏览器还没有提交记录。','duty-help')]));
    }
    async function load(){
      if(busy)return;
      busy=true; fields.disabled=true; refresh.disabled=true; retry.disabled=true;
      try{
        state=await request('/api/duty');
        draw(); retry.hidden=true; loadStatus.textContent='';
      }catch(error){
        loadStatus.textContent=error.message;
        retry.hidden=false;
      }finally{
        busy=false; fields.disabled=!state; refresh.disabled=false; retry.disabled=false;
      }
    }
    from.addEventListener('change',()=>{options(to,member(from)?.position[0]);preview()});
    to.addEventListener('change',preview);
    retry.addEventListener('click',load);
    refresh.addEventListener('click',load);
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy)return;
      const reason=$('duty-reason').value.trim();
      if(reason.length<2){status.textContent='请填写至少 2 字申请理由。';return}
      busy=true; fields.disabled=true;
      try{
        await request('/api/duty/requests','POST',{from:member(from),to:member(to),reason});
        form.reset();
        status.textContent='已提交，等待管理员审批。';
      }catch(error){status.textContent=error.message}
      finally{busy=false;fields.disabled=false;await load()}
    });
    load();
  }

  if(admin){
    const list=$('duty-admin-list'), history=$('duty-admin-history'), notice=$('duty-admin-status');
    const reload=$('duty-admin-refresh');
    let busy=false;
    function reviewCard(item){
      const row=card(item);
      const label=node('label','审批备注（选填）');
      const note=node('input');
      note.maxLength=200;
      label.append(note);
      const buttons=node('div',undefined,'duty-actions');
      for(const [state,text] of [['approved','同意并更新名单'],['rejected','驳回申请']]){
        const button=node('button',text,state==='approved'?'club-primary':'club-quiet');
        button.type='button';
        button.addEventListener('click',async()=>{
          if(busy || !confirm(state==='approved'?'确认交换 '+item.from.name+' 和 '+item.to.name+' 的值日位置？':'确认驳回这条调换申请？'))return;
          busy=true;
          for(const control of buttons.children) control.disabled=true;
          try{
            await request('/api/admin/duty/'+item.id,'PUT',{status:state,note:note.value});
            notice.textContent=state==='approved'?'已同意，正式值日表已更新。':'已驳回。';
            busy=false;
            await load(true);
          }catch(error){notice.textContent=error.message}
          finally{busy=false;for(const control of buttons.children)control.disabled=false}
        });
        buttons.append(button);
      }
      row.append(label,buttons);
      return row;
    }
    async function load(keepNotice=false){
      if(busy)return;
      busy=true;reload.disabled=true;
      try{
        const data=await request('/api/admin/duty');
        const pending=data.requests.filter(item=>item.status==='pending');
        const done=data.requests.filter(item=>item.status!=='pending');
        list.replaceChildren(...(pending.length?pending.map(reviewCard):[node('p','目前没有待审批申请。','duty-help')]));
        history.replaceChildren(...(done.length?done.map(card):[node('p','暂无审批记录。','duty-help')]));
        if(!keepNotice)notice.textContent='';
      }catch(error){notice.textContent=error.message}
      finally{busy=false;reload.disabled=false}
    }
    reload.addEventListener('click',()=>load());
    admin.addEventListener('toggle',()=>{if(admin.open)load()});
    window.addEventListener('class-admin-ready',()=>{if(admin.open)load()});
    window.addEventListener('class-admin-logout',()=>{list.replaceChildren();history.replaceChildren();notice.textContent=''});
  }
})();
