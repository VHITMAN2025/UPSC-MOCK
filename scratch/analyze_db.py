import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')

url = env.get('VITE_SUPABASE_URL')
key = env.get('VITE_SUPABASE_ANON_KEY')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

req = urllib.request.Request(f'{url}/rest/v1/questions?select=id,question_text,question_text_tamil,source_pdf,subject_name,unit_name&limit=400', headers=headers)
with urllib.request.urlopen(req) as resp:
    qs = json.loads(resp.read().decode('utf-8'))

print('Total questions in DB:', len(qs))
bilingual_count = 0
pure_tamil_count = 0
sources = {}
for q in qs:
    sp = q.get('source_pdf') or 'unknown'
    sources[sp] = sources.get(sp, 0) + 1
    t = q.get('question_text') or ''
    has_en = any('a' <= c <= 'z' or 'A' <= c <= 'Z' for c in t)
    if has_en:
        bilingual_count += 1
    else:
        pure_tamil_count += 1

print('Questions with English in question_text:', bilingual_count)
print('Questions with ONLY Tamil in question_text:', pure_tamil_count)
print('Source PDFs breakdown:', sources)
