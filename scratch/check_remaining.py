import os, sys, json, urllib.request

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
supabase_url = None
supabase_key = None

with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('VITE_SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip()
        elif line.startswith('VITE_SUPABASE_ANON_KEY='):
            supabase_key = line.split('=', 1)[1].strip()

req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_a_tamil",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    all_q = json.loads(resp.read().decode('utf-8'))

mixed = []
pure_ta = []
pure_en = []

for q in all_q:
    qt = q.get('question_text') or ''
    has_latin = any('a' <= c.lower() <= 'z' for c in qt)
    has_tamil = any(0x0B80 <= ord(c) <= 0x0BFF for c in qt)
    if has_latin and has_tamil:
        mixed.append(q)
    elif has_tamil and not has_latin:
        pure_ta.append(q)
    elif has_latin and not has_tamil:
        pure_en.append(q)

print(f"Total: {len(all_q)}")
print(f"Pure English in question_text: {len(pure_en)}")
print(f"Mixed in question_text: {len(mixed)}")
print(f"Pure Tamil in question_text: {len(pure_ta)}")
if mixed:
    print("Sample mixed:", repr(mixed[0]['question_text'][:80]))
