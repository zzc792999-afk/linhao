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
  function title(groups,[index]){
    const size=groups[index].length;
    const number=groups.slice(0,index+1).filter(group=>group.length===size).length;
    return (size===1?'单人':'双人')+'第 '+number+' 组';
  }
  const side = ({name,label,position:[index]}) =>
    name+'（'+(label || (index<8?'单人第 '+(index+1)+' 组':'双人第 '+(index-7)+' 组'))+'）';
  const actionText = item => item.kind==='merge' ? item.from.name+' 和 '+item.to.name+' → 合为一个双人组' : item.kind==='split' ? item.from.members.join('、')+' → 分为两个单人组' : side(item.from)+' ⇄ '+side(item.to);
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
    row.append(badge,node('p',actionText(item)),node('p','提交于 '+chinaTime.format(new Date(item.date)),'duty-help'),node('p',item.reason));
    if(item.note) row.append(node('p','审批备注 · '+item.note,'duty-help'));
    return row;
  }

  if(publicPage){
    const form=$('duty-form'), fields=$('duty-fields'), from=$('duty-from'), to=$('duty-to');
    const kind=$('duty-kind'), target=$('duty-target');
    const status=$('duty-form-status'), loadStatus=$('duty-load-status'), retry=$('duty-retry'), refresh=$('duty-refresh');
    let state,busy=false;
    function member(select){
      if(!select.value) return null;
      const position=select.value.split(',').map(Number);
      const members=state.groups[position[0]];
      return {position,name:members[position[1]],members};
    }
    function options(select,{exclude,size}={}){
      const old=select.value;
      const oldText=select.selectedOptions[0]?.textContent;
      const placeholder=node('option','请选择姓名');
      placeholder.value='';
      select.replaceChildren(placeholder);
      const solo=node('optgroup'), pairs=node('optgroup');
      solo.label='单人值日'; pairs.label='双人值日';
      state.groups.forEach((group,i)=>{
        if(i===exclude || (size && group.length!==size))return;
        group.forEach((name,j)=>{
          const option=node('option',name+' · '+title(state.groups,[i]));
          option.value=[i,j].join(',');
          (group.length===1?solo:pairs).append(option);
        });
      });
      select.append(...[solo,pairs].filter(group=>group.children.length));
      if([...select.options].some(option=>option.value===old && option.textContent===oldText)) select.value=old;
    }
    function preview(){
      const first=member(from), second=member(to), hint=$('duty-preview');
      if(kind.value==='split'){
        hint.hidden=!first;
        if(first) hint.textContent=first.members.join('和')+'将各自成为一个单人组。';
        return;
      }
      hint.hidden=!(first&&second);
      if(first&&second && kind.value==='merge'){
        hint.textContent=first.name+'和'+second.name+'将在审批通过后一起双人值日。';
        return;
      }
      if(first&&second){
        const describe=(student,target)=>{
          const partner=state.groups[target.position[0]][1-target.position[1]];
          return student.name+'去'+title(state.groups,target.position)+(partner?'，和'+partner+'一起值日':'');
        };
        hint.textContent=describe(first,second)+'。'+describe(second,first)+'。';
      }
    }
    function drawChoices(){
      const splitting=kind.value==='split';
      const merging=kind.value==='merge';
      options(from,{size:splitting?2:merging?1:undefined});
      target.querySelector('label').textContent=merging?'想一起值日的同学':'想交换的同学位置';
      target.hidden=splitting;
      to.disabled=splitting;
      options(to,{exclude:member(from)?.position[0],size:merging?1:undefined});
      preview();
    }
    function draw(){
      const rows=groups=>groups.map(group=>{
        const row=node('li');
        row.append(...group.map(name=>node('span',name)));
        return row;
      });
      $('duty-solo').replaceChildren(...rows(state.groups.filter(group=>group.length===1)));
      $('duty-pairs').replaceChildren(...rows(state.groups.filter(group=>group.length===2)));
      drawChoices();
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
    kind.addEventListener('change',drawChoices);
    from.addEventListener('change',drawChoices);
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
        await request('/api/duty/requests','POST',{kind:kind.value,from:member(from),to:to.disabled?null:member(to),reason});
        form.reset();
        drawChoices();
        status.textContent='已提交，等待管理员审批。';
      }catch(error){status.textContent=error.message}
      finally{busy=false;fields.disabled=false;await load()}
    });
    load();
  }

  if(admin){
    const list=$('duty-admin-list'), history=$('duty-admin-history'), notice=$('duty-admin-status');
    const reload=$('duty-admin-refresh');
    const add=$('duty-add-form'), addFields=$('duty-add-fields'), partner=$('duty-add-partner');
    const remove=$('duty-remove-form'), removeFields=$('duty-remove-fields'), member=$('duty-remove-member');
    let busy=false, groups;
    function drawPartners(){
      const old=partner.value, oldText=partner.selectedOptions[0]?.textContent;
      const solo=node('option','新建单人组');
      solo.value='';
      partner.replaceChildren(solo);
      groups.forEach((group,index)=>{
        if(group.length!==1)return;
        const option=node('option','与 '+group[0]+' 组成双人组');
        option.value=String(index);
        partner.append(option);
      });
      if([...partner.options].some(option=>option.value===old && option.textContent===oldText))partner.value=old;
    }
    function drawMembers(){
      const old=member.value, oldText=member.selectedOptions[0]?.textContent;
      const placeholder=node('option','请选择姓名');
      placeholder.value='';
      member.replaceChildren(placeholder);
      groups.forEach((group,index)=>group.forEach((name,slot)=>{
        const option=node('option',name+' · '+title(groups,[index]));
        option.value=[index,slot].join(',');
        member.append(option);
      }));
      if([...member.options].some(option=>option.value===old && option.textContent===oldText))member.value=old;
    }
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
          if(busy || !confirm(state==='approved'?'确认更新值日表？\n'+actionText(item):'确认驳回这条调整申请？'))return;
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
      busy=true;reload.disabled=true;addFields.disabled=true;removeFields.disabled=true;
      try{
        const data=await request('/api/admin/duty');
        groups=data.groups;
        drawPartners();
        drawMembers();
        const pending=data.requests.filter(item=>item.status==='pending');
        const done=data.requests.filter(item=>item.status!=='pending');
        list.replaceChildren(...(pending.length?pending.map(reviewCard):[node('p','目前没有待审批申请。','duty-help')]));
        history.replaceChildren(...(done.length?done.map(card):[node('p','暂无审批记录。','duty-help')]));
        if(!keepNotice)notice.textContent='';
      }catch(error){notice.textContent=error.message}
      finally{busy=false;reload.disabled=false;addFields.disabled=!groups;removeFields.disabled=!groups}
    }
    add.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy || !groups)return;
      const name=$('duty-add-name').value.trim();
      if(!name){notice.textContent='请输入姓名。';return}
      const index=partner.value===''?null:Number(partner.value);
      const selected=index===null?null:{position:[index,0],name:groups[index][0]};
      busy=true;addFields.disabled=true;
      try{
        const data=await request('/api/admin/duty/people','POST',{name,partner:selected});
        groups=data.groups;
        add.reset();
        drawPartners();
        drawMembers();
        notice.textContent='已将 '+name+' 加入正式值日表。';
      }catch(error){notice.textContent=error.message}
      finally{busy=false;addFields.disabled=!groups}
    });
    remove.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy || !groups || !member.value)return;
      const position=member.value.split(',').map(Number);
      const [index,slot]=position;
      const members=groups[index], name=members[slot], partnerName=members[1-slot];
      const confirmation='确认把 '+name+' 移出正式值日表？'+
        (partnerName?'\n'+partnerName+' 将改为单人值日。':'');
      if(!confirm(confirmation))return;
      busy=true;removeFields.disabled=true;
      try{
        const data=await request('/api/admin/duty/people','DELETE',{position,name,members});
        remove.reset();
        notice.textContent='已将 '+data.removed+' 移出正式值日表。'+
          (data.affected?' '+data.affected+' 条相关待审批申请已退回。':'');
        busy=false;
        await load(true);
      }catch(error){notice.textContent=error.message}
      finally{busy=false;removeFields.disabled=!groups}
    });
    reload.addEventListener('click',()=>load());
    admin.addEventListener('toggle',()=>{if(admin.open)load()});
    window.addEventListener('class-admin-ready',()=>{if(admin.open)load()});
    window.addEventListener('class-admin-logout',()=>{
      groups=undefined;add.reset();remove.reset();addFields.disabled=true;removeFields.disabled=true;
      list.replaceChildren();history.replaceChildren();notice.textContent='';
    });
  }
})();
