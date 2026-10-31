"""Redact credentials from a post-login trace before it becomes a report attachment."""
import json
import os
from pathlib import Path
import re
import sys
import zipfile

path = Path(sys.argv[1])
temporary = path.with_suffix('.sanitized.zip')
secrets = [os.environ[k].encode() for k in ('E2E_PASSWORD', 'E2E_JWT_SECRET', 'E2E_RUNTIME_PASSWORD') if os.environ.get(k)]
jwt = re.compile(rb'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*')

def scrub(value):
    if isinstance(value, dict):
        if str(value.get('name', '')).lower() in ('authorization', 'cookie', 'set-cookie'):
            return {**value, 'value': '[REDACTED]'}
        return {k: '[REDACTED]' if k.lower() in ('password', 'accesstoken', 'authorization', 'secret') else scrub(v) for k, v in value.items()}
    if isinstance(value, list):
        return [scrub(v) for v in value]
    return value

with zipfile.ZipFile(path) as source, zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as target:
    for item in source.infolist():
        data = source.read(item.filename)
        if not item.filename.endswith(('.png', '.jpeg', '.jpg', '.woff', '.woff2')):
            try:
                lines = data.decode().splitlines()
                data = ('\n'.join(json.dumps(scrub(json.loads(line)), ensure_ascii=False) for line in lines) + '\n').encode()
            except (UnicodeDecodeError, json.JSONDecodeError):
                pass
            data = jwt.sub(b'[JWT REDACTED]', data)
            for secret in secrets:
                data = data.replace(secret, b'[REDACTED]')
        target.writestr(item, data)
temporary.replace(path)
