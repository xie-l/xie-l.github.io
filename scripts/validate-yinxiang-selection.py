"""Validate the public-only editorial manifest. No private-repository access."""
import datetime
import json
import re
from pathlib import Path
def validate(path):
    data=json.loads(Path(path).read_text(encoding='utf-8'))
    assert set(data)=={'schema_version','notes'} and data['schema_version']==1
    assert isinstance(data['notes'],list)
    seen=set()
    for n in data['notes']:
        assert set(n)=={'id','title','summary','excerpt','category','tags','updated','approved_for_publication'}
        assert n['approved_for_publication'] is True
        assert isinstance(n['id'],str) and re.fullmatch(r'public-[a-z0-9-]{1,60}',n['id']) and n['id'] not in seen
        seen.add(n['id'])
        for k,maxlen in [('title',120),('summary',800),('excerpt',2500),('category',40)]:
            assert isinstance(n[k],str) and len(n[k])<=maxlen and (n[k].strip() or k=='excerpt')
        assert isinstance(n['tags'],list) and len(n['tags'])<=12
        assert all(isinstance(x,str) and 0<len(x)<=40 for x in n['tags'])
        assert re.fullmatch(r'\d{4}-\d{2}-\d{2}',n['updated'])
        datetime.date.fromisoformat(n['updated'])
    print('Public selection manifest validated:',len(seen),'approved entries')
if __name__=='__main__':
    validate('data/yinxiang-selection.json')
