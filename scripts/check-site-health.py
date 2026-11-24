#!/usr/bin/env python3
"""Report actual snapshot freshness, Actions results and public Pages availability.
Only module names/statuses are reported, never reading titles or credentials."""
import json
import os
import smtplib
import ssl
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from pathlib import Path

BASE = 'https://xie-l.github.io/'
API = 'https://api.github.com/repos/xie-l/xie-l.github.io/'
NOW = datetime.now(timezone.utc)
TODAY = NOW.astimezone(timezone(timedelta(hours=8))).date()
ROOT = Path(__file__).resolve().parents[1]
issues = []
lines = []

def report(label, ok, detail):
    lines.append(f'- {"OK" if ok else "CHECK"} | {label}: {detail}')
    if not ok:
        issues.append(label)

def get(url, api=False):
    headers = {'User-Agent': 'xie-l-site-health/1.0', 'Cache-Control': 'no-cache'}
    if api:
        headers['Accept'] = 'application/vnd.github+json'
        token = os.environ.get('GH_TOKEN')
        if token:
            headers['Authorization'] = 'Bearer ' + token
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as res:
        return res.read()

def local(name):
    return json.loads((ROOT / 'data' / (name + '.json')).read_text(encoding='utf-8'))

def fresh(value, hours):
    try:
        stamp = datetime.fromisoformat(str(value).replace(' UTC', '+00:00').replace('Z', '+00:00'))
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        age = (NOW - stamp).total_seconds() / 3600
        return -1 <= age <= hours
    except (TypeError, ValueError):
        return False

def price_ok(value):
    try:
        import math
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False

def check_data():
    for filename, keys, hours, validator in [
        ('news', ['tech','tech_cn','energy_intl','energy','energy_cn','hydrogen','papers','policy_nea','policy_ndrc'], 24,
         lambda x: bool(x.get('items'))),
        ('weather', ['Beijing','Shanghai','Nanchang','Xining','Yinchuan','Harbin'], 36,
         lambda x: bool(x.get('current')) and any(str(y.get('date','')) >= str(TODAY) for y in x.get('daily', []))),
    ]:
        data = local(filename)
        for key in keys:
            x = data.get(key, {})
            report(filename + '/' + key, fresh(x.get('updated'), hours) and validator(x), 'snapshot age and validity')
    d = local('weread')
    report('WeRead', bool(d.get('reading') and d.get('recent')) and fresh(d.get('updated'), 48), 'valid reading data within 48 hours')
    d = local('academic')
    report('Academic', bool(d.get('author', {}).get('author_id')) and fresh(d.get('updated'), 240), 'verified author ID required')
    for filename, key in [('daily-data','data_items'),('daily-questions','questions'),('daily-keywords','keywords')]:
        d = local(filename)
        report(filename, d.get('date') in (str(TODAY), str(TODAY-timedelta(days=1))) and bool(d.get(key)), 'daily generated snapshot')
    d = local('energy')
    for name, obj, limit in [
        ('WTI', d.get('oil',{}).get('wti',{}), 144), ('Brent', d.get('oil',{}).get('brent',{}), 144),
        ('Natural gas', d.get('natgas',{}),144), ('FX', d.get('usdcny',{}),144),
        ('Coal', d.get('coal_qhd',{}),144), ('Energy index', d.get('energy_index',{}),144),
        ('CEA',d.get('carbon',{}).get('cea',{}),144), ('EUA',d.get('carbon',{}).get('eua',{}),144),
        ('Newcastle monthly',d.get('coal_qhd',{}).get('newcastle',{}),1800),
        ('Industrial gas PPI monthly',d.get('hydrogen',{}).get('us_ppi',{}),1800)
    ]:
        date = str(obj.get('date') or obj.get('period') or '')
        if len(date) == 7: date += '-01'
        report(name, price_ok(obj.get('price',obj.get('index'))) and fresh(date,limit), 'observation date: ' + (date or 'unknown'))

def check_pages():
    try:
        config = json.loads(get(API+'pages', api=True))
        mode = config.get('build_type','unknown')
        report('Pages publishing source',mode=='workflow','build_type: '+str(mode))
    except Exception as exc:
        report('Pages publishing source',False,type(exc).__name__)
    for path in ['', 'about-new.html', 'blog/', 'files/', 'js/site-health.js']:
        try:
            payload = get(BASE+path)
            report('Pages /'+path, bool(payload), 'public endpoint responded')
        except Exception as exc:
            report('Pages /'+path, False, type(exc).__name__)
    try:
        marker = json.loads(get(BASE+'deployment.json'))
        report('Deployment marker', bool(marker.get('commit')) and fresh(marker.get('built_at'),8), 'recent custom publication')
    except Exception as exc:
        report('Deployment marker',False,type(exc).__name__)
    for name in ['news','weather','energy','weread','academic','daily-data']:
        try:
            actual=json.loads(get(BASE+'data/'+name+'.json'))
            report('Pages snapshot '+name, actual==local(name), 'compare deployed JSON with checked-out main')
        except Exception as exc:
            report('Pages snapshot '+name,False,type(exc).__name__)

def check_actions():
    for name in ['fetch-news','fetch-weather','fetch-energy','fetch-academic','fetch-weread','daily-update','sync-obsidian','daily-backup','update-site-index','site-maintenance','deploy-pages']:
        try:
            runs=json.loads(get(API+'actions/workflows/'+name+'.yml/runs?branch=main&status=completed&per_page=1',api=True)).get('workflow_runs',[])
            run=runs[0] if runs else {}
            report('Actions '+name, run.get('conclusion')=='success', 'last completed run: '+str(run.get('conclusion','unknown')))
        except Exception as exc:
            report('Actions '+name,False,type(exc).__name__)

def notify(body):
    fields = ['ALERT_SMTP_HOST','ALERT_SMTP_USER','ALERT_SMTP_PASSWORD','ALERT_EMAIL_TO']
    if not all(os.environ.get(x) for x in fields):
        print('::warning::SMTP secrets not configured; use GitHub workflow failure notifications.')
        return
    msg=EmailMessage()
    msg['Subject']='[科研主页] 运行异常检查'
    msg['From']=os.environ['ALERT_SMTP_USER']
    msg['To']=os.environ['ALERT_EMAIL_TO']
    msg.set_content(body)
    # Use TLS from the first connection; QQ and other SSL SMTP providers use 465.
    with smtplib.SMTP_SSL(os.environ['ALERT_SMTP_HOST'],465,timeout=25,context=ssl.create_default_context()) as smtp:
        smtp.login(os.environ['ALERT_SMTP_USER'],os.environ['ALERT_SMTP_PASSWORD'])
        smtp.send_message(msg)

def main():
    for check in (check_data,check_pages,check_actions):
        try:
            check()
        except Exception as exc:
            report(check.__name__,False,type(exc).__name__)
    body='科研主页运行检查 '+NOW.isoformat()+'\n'+'\n'.join(lines)+'\nhttps://github.com/xie-l/xie-l.github.io/actions'
    print(body)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a',encoding='utf-8') as f:
            f.write(body+'\n')
    if issues:
        try:
            notify(body)
        except Exception as exc:
            print('::error::Email delivery failed: '+type(exc).__name__)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
