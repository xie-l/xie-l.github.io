/* Public editorial manifest only. Never request private API, notes, or credentials. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const list=$('yinxiang-list'), status=$('yinxiang-status'), daily=$('yinxiang-daily'), search=$('yinxiang-search'), category=$('yinxiang-category'), order=$('yinxiang-order'), more=$('yinxiang-more');
  if(!list||!status||!daily||!search||!category||!order||!more) return;
  let notes=[], limit=6, newest=true;
  const element=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
  const card=(n,isDaily=false)=>{
    const article=document.createElement('article');
    article.style.cssText='border:1px solid #8883;border-radius:8px;padding:12px;overflow-wrap:anywhere';
    if(isDaily) article.append(element('small','今日知识回顾 · 北京时间每日轮换'));
    const title=element('h3',n.title);title.style.cssText='font-size:1rem;margin:5px 0';article.append(title);
    article.append(element('p',n.summary));
    if(n.excerpt) {const details=document.createElement('details');details.append(element('summary','展开精选摘录'),element('p',n.excerpt));article.append(details);}
    const meta=element('small',[n.category,...n.tags,n.updated].join(' · '));article.append(meta);
    return article;
  };
  const render=()=>{
    const query=search.value.trim().toLowerCase();
    const matches=notes.filter(n=>(!category.value||n.category===category.value)&&(!query||[n.title,n.summary,n.excerpt,n.category,...n.tags].join(' ').toLowerCase().includes(query)));
    matches.sort((a,b)=>newest?b.updated.localeCompare(a.updated):a.title.localeCompare(b.title,'zh-CN'));
    list.replaceChildren(...matches.slice(0,limit).map(n=>card(n)));
    status.textContent=notes.length?('已批准公开 '+notes.length+' 条 · 当前匹配 '+matches.length+' 条'): '尚无经确认可公开的精选笔记；等待所有者审核，不影响私有备份。';
    more.hidden=matches.length<=limit;
  };
  search.addEventListener('input',()=>{limit=6;render();});
  category.addEventListener('change',()=>{limit=6;render();});
  order.addEventListener('click',()=>{newest=!newest;order.textContent=newest?'最近更新':'按标题排序';render();});
  more.addEventListener('click',()=>{limit+=6;render();});
  (async()=>{
    try{
      const response=await fetch('/data/yinxiang-selection.json',{cache:'no-cache'});
      if(!response.ok) throw Error('manifest unavailable');
      const data=await response.json();
      if(data.schema_version!==1||!Array.isArray(data.notes)) throw Error('manifest invalid');
      notes=data.notes.filter(n=>n.approved_for_publication===true&&typeof n.title==='string'&&typeof n.summary==='string'&&typeof n.excerpt==='string'&&typeof n.category==='string'&&Array.isArray(n.tags)&&n.tags.every(t=>typeof t==='string')&&typeof n.updated==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(n.updated));
      for(const name of [...new Set(notes.map(n=>n.category))].sort()){const option=element('option',name);option.value=name;category.append(option);}
      if(notes.length){
        const day=Math.floor((Date.now()+8*3600000)/86400000);
        const sorted=notes.slice().sort((a,b)=>a.id.localeCompare(b.id));
        daily.replaceChildren(card(sorted[day%sorted.length],true));
      }
      render();
    }catch(_){status.textContent='精选清单暂时无法读取，请稍后刷新；私有备份不受影响。';}
  })();
})();
