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

# Fetch total question count and statistics
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,paper_id,question_text,question_text_tamil,option_a,option_a_tamil,group_tag,unit_tag,source_pdf",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    all_q = json.loads(resp.read().decode('utf-8'))

print(f"Total questions in DB: {len(all_q)}")

bilingual_stems = 0
pure_tamil_stems = 0
pure_english_stems = 0
both_fields_populated = 0
only_en_field_populated = 0
only_ta_field_populated = 0
bilingual_options = 0

for q in all_q:
    en_field = q.get('question_text') or ''
    ta_field = q.get('question_text_tamil') or ''
    opt_a = q.get('option_a') or ''
    
    has_en_field = bool(en_field.strip())
    has_ta_field = bool(ta_field.strip())
    
    if has_en_field and has_ta_field:
        both_fields_populated += 1
    elif has_en_field:
        only_en_field_populated += 1
    elif has_ta_field:
        only_ta_field_populated += 1
        
    has_latin = any('a' <= c.lower() <= 'z' for c in en_field)
    has_tamil = any(0x0B80 <= ord(c) <= 0x0BFF for c in en_field)
    
    if has_latin and has_tamil:
        bilingual_stems += 1
    elif has_tamil and not has_latin:
        pure_tamil_stems += 1
    elif has_latin and not has_tamil:
        pure_english_stems += 1

    if ' / ' in opt_a and any(0x0B80 <= ord(c) <= 0x0BFF for c in opt_a):
        bilingual_options += 1

print(f"both_fields_populated: {both_fields_populated}")
print(f"only_en_field_populated: {only_en_field_populated}")
print(f"only_ta_field_populated: {only_ta_field_populated}")
print(f"bilingual_stems (Latin + Tamil in question_text): {bilingual_stems}")
print(f"pure_tamil_stems (pure Tamil in question_text): {pure_tamil_stems}")
print(f"pure_english_stems (pure Latin in question_text): {pure_english_stems}")
print(f"bilingual_options (' / ' in option_a): {bilingual_options}")
