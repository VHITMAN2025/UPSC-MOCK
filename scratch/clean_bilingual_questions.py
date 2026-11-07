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

# Fetch questions where question_text contains "தமிழ்:"
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_a_tamil,option_b,option_b_tamil,option_c,option_c_tamil,option_d,option_d_tamil&question_text=ilike.*%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D%3A*&limit=150",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)

with urllib.request.urlopen(req) as resp:
    bilingual_qs = json.loads(resp.read().decode('utf-8'))

print(f"Found {len(bilingual_qs)} questions with 'தமிழ்:' in question_text")

def split_stem(stem, existing_ta):
    if 'தமிழ்:' in stem:
        parts = stem.split('தமிழ்:')
        en = parts[0].strip()
        ta = parts[1].strip() if not existing_ta else existing_ta.strip()
        return en, ta
    return stem, existing_ta

def split_opt(opt_val, existing_ta):
    opt_val = (opt_val or '').strip()
    if ' / ' in opt_val:
        parts = opt_val.split(' / ')
        p1, p2 = parts[0].strip(), parts[1].strip()
        has_latin_1 = any('a' <= c.lower() <= 'z' for c in p1)
        has_tamil_2 = any(0x0B80 <= ord(c) <= 0x0BFF for c in p2)
        if has_latin_1 and has_tamil_2:
            return p1, p2
        elif has_tamil_2:
            return p2, p1
    return opt_val, (existing_ta or opt_val).strip()

updated_count = 0
for q in bilingual_qs:
    q_id = q['id']
    en_stem, ta_stem = split_stem(q.get('question_text', ''), q.get('question_text_tamil', ''))
    en_a, ta_a = split_opt(q.get('option_a'), q.get('option_a_tamil'))
    en_b, ta_b = split_opt(q.get('option_b'), q.get('option_b_tamil'))
    en_c, ta_c = split_opt(q.get('option_c'), q.get('option_c_tamil'))
    en_d, ta_d = split_opt(q.get('option_d'), q.get('option_d_tamil'))

    patch_payload = {
        "question_text": en_stem,
        "question_text_tamil": ta_stem,
        "option_a": en_a,
        "option_a_tamil": ta_a,
        "option_b": en_b,
        "option_b_tamil": ta_b,
        "option_c": en_c,
        "option_c_tamil": ta_c,
        "option_d": en_d,
        "option_d_tamil": ta_d,
    }

    body = json.dumps(patch_payload).encode('utf-8')
    patch_req = urllib.request.Request(
        f"{supabase_url}/rest/v1/questions?id=eq.{q_id}",
        data=body,
        headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        method="PATCH"
    )
    with urllib.request.urlopen(patch_req) as p_resp:
        updated_count += 1

print(f"Successfully cleaned and updated {updated_count} bilingual questions in Supabase!")
