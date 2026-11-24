"""Collect CEA close and explicitly identified EUA primary-auction clearing prices.
Do not substitute regional allowances, futures or other markets."""
import io
import math
import re
import urllib.request
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import pandas as pd

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (compatible; xie-l.github.io research dashboard)'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()

def cea():
    url='https://www.zsbu.com/'
    soup=BeautifulSoup(fetch(url),'html.parser')
    text=' '.join(soup.stripped_strings)
    # National CEA card: never match regional products or annual vintages.
    match=re.search(r'全国碳排放配额\s*CEA\s*([0-9.]+)\s*元\s*/\s*吨\s*([+\-−]?[0-9.]+)%\s*成交量\s*([\d,]+|--)\s*吨\s*[·・]?\s*(\d{4}-\d{2}-\d{2})',text)
    if not match:
        raise ValueError('national CEA card format unavailable')
    price,pct,volume,date=match.groups()
    price=float(price); pct=float(pct.replace('−','-'))
    assert 0<price<10000 and datetime.fromisoformat(date).date()<=datetime.now(timezone.utc).date()
    return {'price':f'{price:.2f}','unit':'元/吨','pct':f'{pct:+.2f}%','trend':'up' if pct>0 else 'down' if pct<0 else 'flat','date':date,'volume':volume,'label':'全国CEA挂牌协议收盘价','source':'中晟碳汇（转引上海环境能源交易所）','source_url':url,'market_type':'national_cea_close'}

def eua():
    year=datetime.now(timezone.utc).year
    base='https://public.eex-group.com/eex/eua-auction-report/'
    url=base+f'emission-spot-primary-market-auction-report-{year}-data.xlsx'
    workbook=pd.read_excel(io.BytesIO(fetch(url)),sheet_name=None,header=None,engine='openpyxl')
    observations={}
    for frame in workbook.values():
        for i in range(min(25,len(frame))):
            cells=[str(v).lower().strip() for v in frame.iloc[i]]
            def find(predicate):
                return next((k for k,v in enumerate(cells) if predicate(v)),None)
            dc=find(lambda v:'auction date' in v or v=='date')
            pc=find(lambda v:'clearing price' in v or 'auction price' in v)
            cc=find(lambda v:v=='contract' or v=='product' or v.startswith('contract name'))
            sc=find(lambda v:v=='status' or v=='auction status')
            ac=find(lambda v:v=='auction name' or v=='auction')
            if None in (dc,pc,cc): continue
            for _,row in frame.iloc[i+1:].iterrows():
                contract=str(row.iloc[cc]).upper().strip()
                if not re.fullmatch(r'(?:EUA|EUAS|EU ALLOWANCES|EUROPEAN UNION ALLOWANCES)(?:\s*\([^)]*\))?',contract): continue
                auction=str(row.iloc[ac]).upper().strip() if ac is not None else ''
                if any(x in auction for x in ('ETS2','EUAA','AVIATION','UKA')): continue
                if sc is not None and any(x in str(row.iloc[sc]).lower() for x in ('cancel','fail','unsuccessful')): continue
                date=pd.to_datetime(row.iloc[dc],errors='coerce',dayfirst=True)
                try:
                    raw=row.iloc[pc]
                    price=float(raw) if isinstance(raw,(int,float)) else float(str(raw).replace('€','').strip().replace(',','.'))
                except (TypeError,ValueError): continue
                if pd.isna(date) or date.date()>datetime.now(timezone.utc).date() or not math.isfinite(price) or not 0<price<10000: continue
                observations[date.date().isoformat()]=price
            break
    dates=sorted(observations)
    if not dates:
        # Log public workbook layout only, never account data.
        for name, frame in workbook.items():
            print('EEX sheet',name,'headers:',[[str(v) for v in frame.iloc[i] if pd.notna(v)] for i in range(min(10,len(frame)))])
        raise ValueError('no verified EUA auction observations')
    latest=dates[-1]; price=observations[latest]
    return {'price':f'{price:.2f}','unit':'€/吨','pct':'--','trend':'flat','date':latest,'history':[observations[d] for d in dates[-14:]],'label':'EUA 一级市场拍卖清算价','market_type':'eua_primary_auction','source':'EEX 官方拍卖报告','source_url':base+'index.html'}
