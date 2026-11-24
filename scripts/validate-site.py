"""Validate source syntax without starting collectors or modifying site data."""
import ast
import re
import subprocess
import tempfile
import textwrap
from html.parser import HTMLParser
from pathlib import Path

for name in ('scripts/check-site-health.py','scripts/archive/daily_update.py','scripts/build-site-index.py','scripts/validate-site.py','scripts/carbon-quotes.py','scripts/fetch-weread-public.py'):
    ast.parse(Path(name).read_text(encoding='utf-8'), filename=name)

for path in Path('.github/workflows').glob('*.yml'):
    lines = path.read_text(encoding='utf-8').splitlines()
    for i, line in enumerate(lines):
        match = re.fullmatch(r"(\s*)python3?\s*<<\s*['\"]?(PYEOF|PY)['\"]?\s*", line)
        if not match:
            continue
        delimiter = match.group(2)
        end = next((n for n in range(i+1,len(lines)) if lines[n].strip()==delimiter), None)
        if end is None:
            raise ValueError(f'{path}:{i+1}: missing Python heredoc terminator')
        ast.parse(textwrap.dedent('\n'.join(lines[i+1:end])), filename=f'{path}:{i+1}')

for name in ('js/site-health.js','admin/main.js','admin/profile-editor.js'):
    subprocess.run(['node','--check',name],check=True)
for name in ('scripts/build-public-site.sh','scripts/push-data-update.sh'):
    subprocess.run(['bash','-n',name],check=True)

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active=False
        self.buf=[]
        self.scripts=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script':
            a=dict(attrs)
            self.active=not a.get('src') and a.get('type','text/javascript') in ('text/javascript','application/javascript','module')
            self.buf=[]
    def handle_data(self,data):
        if self.active: self.buf.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.active:
            self.scripts.append(''.join(self.buf))
            self.active=False
for name in ('index.html','admin/login.html','admin/dashboard.html'):
    p=Scripts()
    p.feed(Path(name).read_text(encoding='utf-8'))
    for s in p.scripts:
        with tempfile.NamedTemporaryFile(suffix='.js',mode='w',encoding='utf-8') as f:
            f.write(s)
            f.flush()
            subprocess.run(['node','--check',f.name],check=True)
print('Source syntax checks passed.')
