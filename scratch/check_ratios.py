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
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_b,option_c,option_d&limit=4000",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    questions = json.loads(resp.read().decode('utf-8'))

pure_tamil = []
bilingual = []
pure_english = []

for q in questions:
    t = q.get('question_text') or ''
    # count tamil chars and latin chars
    ta_count = sum(1 for c in t if 0x0B80 <= ord(c) <= 0x0BFF)
    # remove [A], [R], [General Tamil] before counting latin
    t_clean = t.replace('[A]', '').replace('[R]', '').replace('[General Tamil]', '').replace('[Tamil]', '')
    # find latin words (length >= 2)
    latin_words = [w for w in t_clean.split() if any('a' <= c.lower() <= 'z' for c in w) and not any(0x0B80 <= ord(c) <= 0x0BFF for c in w)]
    
    if ta_count > 0 and len(latin_words) < 3:
        pure_tamil.append(q)
    elif ta_count > 0 and len(latin_words) >= 3:
        bilingual.append(q)
    else:
        pure_english.append(q)

print(f"Total questions: {len(questions)}")
print(f"Pure Tamil questions: {len(pure_tamil)}")
print(f"Bilingual questions: {len(bilingual)}")
print(f"Pure English questions: {len(pure_english)}")
