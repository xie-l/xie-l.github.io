"""Use Tencent's documented Agent Gateway; never publish private shelf entries."""
import json
import os
import sys
import urllib.request
import urllib.error
import time
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
result=None
for attempt in range(3):
    try:
        body=json.dumps({'api_name':'/shelf/sync','skill_version':'1.0.6'}).encode()
        request=urllib.request.Request('https://i.weread.qq.com/api/agent/gateway',data=body,
            headers={'Authorization':'Bearer '+key,'Content-Type':'application/json','Accept':'application/json','User-Agent':'WeRead public shelf dashboard'})
        with urllib.request.urlopen(request,timeout=25) as response:
            result=json.load(response)
        break
    except urllib.error.HTTPError as exc:
        if exc.code in (408,425,429,499,500,502,503,504) and attempt < 2:
            print('WeRead transient HTTP '+str(exc.code)+'; retry '+str(attempt+1)+'/2')
            time.sleep(3*(attempt+1))
            continue
        # Classify the server response without printing the response, key or account details.
        reason = '检查授权、接口参数或服务状态'
        try:
            error = json.loads(exc.read(8192))
            if isinstance(error,dict):
                code = error.get('errcode')
                if isinstance(code,int) and not isinstance(code,bool):
                    reason += '；业务错误码 '+str(code)
                message = ' '.join(str(error.get(k,'')) for k in ('errmsg','message','msg')).lower()
                if any(x in message for x in ('version','版本','upgrade','升级')):
                    reason += '；服务端提示版本问题'
                elif any(x in message for x in ('permission','unauthorized','授权','权限','apikey','api key')):
                    reason += '；服务端提示授权问题'
                elif any(x in message for x in ('parameter','参数')):
                    reason += '；服务端提示参数问题'
        except (ValueError,OSError):
            pass
        defer('官方接口 HTTP '+str(exc.code)+'；'+reason)
    except (OSError,ValueError) as exc:
        if attempt < 2:
            print('WeRead transient request/response error; retry '+str(attempt+1)+'/2')
            time.sleep(3*(attempt+1))
            continue
        defer('官方接口暂不可用或响应格式异常：'+type(exc).__name__)
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
