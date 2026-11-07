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

# Fetch all questions
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_b,option_c,option_d,option_a_tamil,option_b_tamil,option_c_tamil,option_d_tamil,explanation,explanation_tamil&limit=4000",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    questions = json.loads(resp.read().decode('utf-8'))

missing_en = []
for q in questions:
    stem_en = q.get('question_text') or ''
    # Check if stem_en has Latin alphabetic characters
    # Note: if stem_en is '[General Tamil] ...' or pure Tamil
    has_real_english = any('a' <= c.lower() <= 'z' for c in stem_en)
    # Also check if it's bilingual like 'English\nதமிழ்: ...'
    # If it is bilingual, it ALREADY has English!
    if not has_real_english:
        missing_en.append(q)

print(f"Total questions in DB: {len(questions)}")
print(f"Questions missing real English: {len(missing_en)}")
