#!/usr/bin/env python3
"""Export committed source only; remove the private hosting project identity."""
import io
import json
import subprocess
import sys
import tarfile
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
if subprocess.run(['git', 'diff', '--quiet', 'HEAD'], cwd=root).returncode:
    raise SystemExit('Commit reviewed source before exporting.')
revision = subprocess.check_output(['git', 'rev-parse', '--verify', 'HEAD'], cwd=root, text=True).strip()
archive = subprocess.check_output(['git', 'archive', '--format=tar', revision], cwd=root)
target = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'release' / 'second-take-submission.zip'
target = target.resolve()
target.parent.mkdir(parents=True, exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(archive)) as source, zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for item in source:
        if item.isdir() or item.name == "SOURCE_SNAPSHOT.md":
            continue
        if not item.isfile():
            raise SystemExit('Unexpected non-regular source file: ' + item.name)
        path = Path(item.name)
        if path.is_absolute() or '..' in path.parts:
            raise SystemExit('Invalid archive path')
        if any(part in {'.git', 'node_modules', '.wrangler', '.sites-runtime'} for part in path.parts):
            raise SystemExit('Local-only file is tracked: ' + item.name)
        if (path.name.startswith('.env') and path.name != '.env.example') or path.name.startswith('.dev.vars') or path.suffix in {'.pem', '.sqlite', '.db'}:
            raise SystemExit('Potential local data is tracked: ' + item.name)
        data = source.extractfile(item).read()
        if item.name == '.openai/hosting.json':
            config = json.loads(data)
            config.pop('project_id', None)
            data = (json.dumps(config, indent=2) + '\n').encode()
        bundle.writestr('second-take/' + item.name, data)
    bundle.writestr('second-take/SOURCE_SNAPSHOT.md', '# Source snapshot\n\nSource revision: `' + revision + '`\n\nExported from committed source. The sole source transformation removes the original private Site project ID from `.openai/hosting.json`; logical runtime bindings are retained. No Git history, installed dependencies, database, session data or runtime credentials are included. See `docs/BUILD_DISCLOSURE.md` for work history and attribution.\n')
with zipfile.ZipFile(target) as bundle:
    if bundle.testzip() is not None:
        raise SystemExit('Archive integrity verification failed')
print(target)
