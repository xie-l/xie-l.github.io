"""Use Tencent's documented Agent Gateway; never publish private shelf entries."""
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

def defer(reason):
    print('::warning::WeRead: '+reason)
    summary=os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary,'a',encoding='utf-8') as f:
            f.write('微信读书：'+reason+'；保留上次公开数据。\n')
    sys.exit(0)

key=os.environ.get('WEREAD_API_KEY','').strip()
if not key.startswith('wrk-'):
    defer('需要在 GitHub Actions Secret 设置官方 WEREAD_API_KEY')
try:
    body=json.dumps({'api_name':'/shelf/sync','skill_version':'1.0.6'}).encode()
    request=urllib.request.Request('https://i.weread.qq.com/api/agent/gateway',data=body,
        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json','User-Agent':'WeRead public shelf dashboard'})
    with urllib.request.urlopen(request,timeout=25) as response:
        result=json.load(response)
except urllib.error.HTTPError as exc:
    defer('官方接口 HTTP '+str(exc.code)+'；检查授权或服务状态')
except (OSError,ValueError):
    defer('官方接口暂不可用或响应格式异常')
if not isinstance(result,dict) or result.get('errcode',0) not in (0,'0',None):
    defer('官方接口返回异常')
shelf=result.get('data',result)
if not isinstance(shelf,dict) or not isinstance(shelf.get('books'),list):
    defer('书架响应格式无法确认')
print('Official shelf response validated; checking public-only items.')
entries=[]
for book in shelf['books']:
    if not isinstance(book,dict) or book.get('secret') not in (0,'0',False) or not book.get('title'):
        continue
    stamp=book.get('readUpdateTime') or 0
    try:
        stamp=float(stamp)
        if stamp>1e10: stamp/=1000
        last=datetime.fromtimestamp(stamp,tz=timezone.utc).date().isoformat() if stamp>0 else ''
    except (TypeError,ValueError,OverflowError,OSError):
        stamp=0;last=''
    finished=book.get('finishReading') in (1,'1',True)
    entries.append((stamp,{'title':str(book['title']),'author':str(book.get('author') or ''),'cover':str(book.get('cover') or ''),'progress':100 if finished else None,'finished':finished,'last_read':last}))
if not entries:
    defer('授权响应有效，但未找到明确公开的电子书；不会发布私密书籍')
entries.sort(key=lambda x:x[0],reverse=True)
recent=[b for _,b in entries[:5]]
output={'reading':recent[0],'recent':recent,'updated':datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),'source':'微信读书官方 Agent API（仅公开电子书）'}
Path('data/weread.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Public shelf snapshot: {len(recent)} entries')
