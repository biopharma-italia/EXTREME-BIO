#!/usr/bin/env python3
import os
import re

SITE_DIR = '/home/user/webapp/site'
EXCLUDE_DIRS = {'components', 'templates', 'backups', 'output', '.git'}

broken = []
pages_checked = 0

def check_file_exists(path):
    full_path = os.path.join(SITE_DIR, path)
    if os.path.isfile(full_path):
        return True
    if os.path.isdir(full_path):
        if os.path.isfile(os.path.join(full_path, 'index.html')):
            return True
    if not path.endswith('.html') and '.' not in os.path.basename(path):
        if os.path.isfile(full_path + '.html'):
            return True
        if os.path.isfile(os.path.join(full_path, 'index.html')):
            return True
    return False

def normalize_path(href, current_page):
    if not href:
        return None
    if href.startswith('#') or href.startswith('javascript:') or href.startswith('mailto:') or href.startswith('tel:'):
        return None
    if href.startswith('http://') or href.startswith('https://'):
        return None
    # Skip template placeholders
    if '{{' in href or '${' in href:
        return None
    current_dir = os.path.dirname(current_page)
    if href.startswith('/'):
        full_path = href.lstrip('/')
    else:
        full_path = os.path.normpath(os.path.join(current_dir, href))
    full_path = full_path.split('#')[0].split('?')[0]
    return full_path

for root, dirs, files in os.walk(SITE_DIR):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    for file in files:
        if file.endswith('.html'):
            rel_path = os.path.relpath(os.path.join(root, file), SITE_DIR)
            pages_checked += 1
            try:
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                hrefs = re.findall(r'href=["\']([^"\']+)["\']', content)
                for href in hrefs:
                    normalized = normalize_path(href, rel_path)
                    if normalized and not check_file_exists(normalized):
                        broken.append((rel_path, href, normalized))
            except Exception as e:
                pass

print(f'Pagine pubbliche verificate: {pages_checked}')
print(f'Link rotti in pagine pubbliche: {len(broken)}')
if broken:
    print('\nLink rotti:')
    for src, href, dest in broken[:30]:
        print(f'  {src}: {href} -> {dest}')
    if len(broken) > 30:
        print(f'  ... e altri {len(broken) - 30}')
else:
    print('\n✅ NESSUN LINK ROTTO NELLE PAGINE PUBBLICHE!')
