/* Public read-only status: never ask for credentials. */
(() => {
  'use strict';
  const repo = 'https://github.com/xie-l/xie-l.github.io';
  const raw = 'https://raw.githubusercontent.com/xie-l/xie-l.github.io/main/data/';
  const section = document.createElement('section');
  section.id = 'site-health';
  section.className = 'section';
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = '站点运行监控';
  const hint = document.createElement('p');
  hint.textContent = '按数据实际时间检测；不以提交成功代替数据成功。';
  const rows = document.createElement('div');
  rows.setAttribute('aria-live', 'polite');
  const link = document.createElement('a');
  link.href = repo + '/actions';
  link.textContent = '查看完整运行日志';
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  const refresh = document.createElement('button');
  refresh.type = 'button'; refresh.textContent = '刷新检测';
  refresh.style.margin = '0 12px';
  section.append(title, hint, rows, link, refresh);
  const anchor = document.querySelector('main .section');
  if (anchor) anchor.parentNode.insertBefore(section, anchor);
  else (document.querySelector('main') || document.body).prepend(section);
  const get = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const r = await fetch(url, {cache:'no-store',signal:controller.signal});
      if (!r.ok) throw Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  };
  const hours = t => (Date.now() - Date.parse(String(t || '').replace(/ UTC$/, 'Z').replace(' ', 'T'))) / 3600000;
  const fresh = (t, max) => Number.isFinite(hours(t)) && hours(t) >= -1 && hours(t) <= max;
  const validPrice = x => x != null && x !== '' && x !== '--' && Number.isFinite(Number(x));
  const dates = (obj, keys, max, validate) => {
    const bad = keys.filter(k => !obj[k] || !validate(obj[k]) || !fresh(obj[k].updated,max));
    return bad.length ? ['需检查',bad.join('、')] : ['正常',keys.length+' 项均有效且在时效范围内'];
  };
  function add(name, state, detail) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #8883';
    const label = document.createElement('strong'); label.textContent = name;
    const info = document.createElement('span'); info.textContent = detail;
    info.style.cssText = 'flex:1;min-width:130px;font-size:12px;overflow-wrap:anywhere';
    const status = document.createElement('span'); status.textContent = state;
    status.style.color = state === '正常' ? '#24845b' : state === '异常' ? '#c43d3d' : '#b87916';
    row.append(label,info,status);rows.append(row);
  }
  let busy = false;
  async function run() {
    if (busy) return; busy=true; refresh.disabled=true;
    rows.replaceChildren(); hint.textContent='正在检测仓库数据与站点发布状态…';
    const today = new Date(Date.now()+28800000).toISOString().slice(0,10);
    const checks = [
      ['新闻资讯','news',d=>dates(d,['tech','tech_cn','energy_intl','energy','energy_cn','hydrogen','papers','policy_nea','policy_ndrc'],24,x=>Array.isArray(x.items)&&x.items.length>0)],
      ['六城市天气','weather',d=>dates(d,['Beijing','Shanghai','Nanchang','Xining','Yinchuan','Harbin'],36,x=>x.current&&Array.isArray(x.daily)&&x.daily.some(y=>y.date>=today))],
      ['微信读书','weread',d=>d.reading&&d.recent?.length&&fresh(d.updated,48)?['正常',d.updated]:['待恢复','无有效阅读数据或同步过期；检查微信读书授权']],
      ['学术统计','academic',d=>d.author?.author_id&&fresh(d.updated,240)?['正常',d.updated]:['需检查','作者身份尚未确认或数据过期']],
      ['每日学习后台','daily-data',d=>d.date===today&&d.data_items?.length?['正常',d.date]:['需检查','后台日期 '+(d.date||'未知')+'；前端轮换独立运行']],
      ['能源行情','energy',d=>{const list=[['WTI',d.oil?.wti],['Brent',d.oil?.brent],['天然气',d.natgas],['汇率',d.usdcny],['煤炭',d.coal_qhd],['能源指数',d.energy_index],['CEA',d.carbon?.cea],['EUA',d.carbon?.eua]];const bad=list.filter(([n,x])=>!validPrice(x?.price)||!fresh(x?.date,['WTI','Brent','天然气'].includes(n)?216:144)).map(([n])=>n);return bad.length?['需检查',bad.join('、')+' 缺失或滞后']:['正常',d.updated||'有效'];}]
    ];
    const result = await Promise.all(checks.map(async ([name,file,check])=>{
      try {return [name,...check(await get(raw+file+'.json'))];}
      catch(e){return [name,'异常','无法获取或解析数据'];}
    }));
    result.forEach(r=>add(...r));
    try {
      const marker=await get('/deployment.json');
      if(!/^[a-f0-9]{40}$/.test(marker.commit||'')) throw Error();
      add('Pages 发布',fresh(marker.built_at,8)?'正常':'需检查',marker.commit.slice(0,8)+' · '+marker.built_at+'；不代表与最新仓库完全一致');
    }catch(e){add('Pages 发布','需检查','尚无自定义部署标记，检查发布源和运行日志');}
    try {
      const latest=await get('https://api.github.com/repos/xie-l/xie-l.github.io/actions/runs?per_page=50');
      const byName=new Map();
      for(const item of latest.workflow_runs||[])if(item.status==='completed'&&!['cancelled','skipped','neutral','stale'].includes(item.conclusion)&&!byName.has(item.workflow_id||item.path||item.name))byName.set(item.workflow_id||item.path||item.name,item);
      const failed=[...byName.values()].filter(x=>x.status==='completed'&&x.conclusion==='failure').map(x=>x.name);
      add('Actions 最近记录',failed.length?'异常':'正常',failed.length?failed.join('、')+' 失败':'最近 50 次记录中各任务最近有效结果未发现失败；数据仍需单独检查');
    }catch(e){add('Actions 最近记录','需检查','API 暂不可用或限流，请打开运行日志');}
    hint.textContent='本次检测：'+new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+'（北京时间）';
    busy=false;refresh.disabled=false;
  }
  refresh.addEventListener('click',run);
  run();
  setInterval(()=>{if(!document.hidden)run();}, 900000);
})();
