import os, sys, json, urllib.request, time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
supabase_url = None
supabase_key = None

with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()
        elif line.startswith('VITE_SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip()
        elif line.startswith('VITE_SUPABASE_ANON_KEY='):
            supabase_key = line.split('=', 1)[1].strip()

dest_path = os.path.join(os.getcwd(), 'src', 'data', 'question_translations.json')
translations = {}
if os.path.exists(dest_path):
    with open(dest_path, 'r', encoding='utf-8') as f:
        translations = json.load(f)

# Fetch all questions
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_b,option_c,option_d&limit=4000",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    questions = json.loads(resp.read().decode('utf-8'))

remaining = []
for q in questions:
    q_id = q['id']
    if q_id in translations:
        continue
    t = q.get('question_text') or ''
    ta_count = sum(1 for c in t if 0x0B80 <= ord(c) <= 0x0BFF)
    t_clean = t.replace('[A]', '').replace('[R]', '').replace('[General Tamil]', '').replace('[Tamil]', '')
    latin_words = [w for w in t_clean.split() if any('a' <= c.lower() <= 'z' for c in w) and not any(0x0B80 <= ord(c) <= 0x0BFF for c in w)]
    
    if ta_count > 0 and len(latin_words) < 3:
        remaining.append(q)

print(f"Remaining questions to translate: {len(remaining)}")

if remaining:
    items = []
    for q in remaining:
        items.append({
            "id": q['id'],
            "question": q.get('question_text_tamil') or q.get('question_text'),
            "a": q.get('option_a'),
            "b": q.get('option_b'),
            "c": q.get('option_c'),
            "d": q.get('option_d')
        })

    prompt = """You are an expert translator for TNPSC examinations.
Translate the following questions and their 4 options from Tamil into clear, natural, high-quality English.
Keep proper nouns accurately transliterated (e.g. U.Ve. Swaminatha Iyer, Nayanar, Bharathiyar).
If assertion/reason, translate as 'Assertion [A]: ... Reason [R]: ...'.

Return strictly a JSON array of objects with schema:
[
  {
    "id": "<matching question id>",
    "en_question_text": "<English question stem>",
    "en_option_a": "<English option A>",
    "en_option_b": "<English option B>",
    "en_option_c": "<English option C>",
    "en_option_d": "<English option D>"
  }
]

Questions to translate:
""" + json.dumps(items, ensure_ascii=False, indent=2)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }).encode('utf-8')

    req_ai = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_ai, timeout=30) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        raw_text = res['candidates'][0]['content']['parts'][0]['text']
        results = json.loads(raw_text)
        for item in results:
            translations[item['id']] = {
                "en_question_text": item.get('en_question_text', ''),
                "en_option_a": item.get('en_option_a', ''),
                "en_option_b": item.get('en_option_b', ''),
                "en_option_c": item.get('en_option_c', ''),
                "en_option_d": item.get('en_option_d', ''),
            }
        with open(dest_path, 'w', encoding='utf-8') as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        print(f"Translated remaining {len(results)} items! Total now in file: {len(translations)}")
