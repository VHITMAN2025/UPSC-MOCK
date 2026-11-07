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

# Destination file
dest_path = os.path.join(os.getcwd(), 'src', 'data', 'question_translations.json')
os.makedirs(os.path.dirname(dest_path), exist_ok=True)

# Load existing translations if any
translations = {}
if os.path.exists(dest_path):
    try:
        with open(dest_path, 'r', encoding='utf-8') as f:
            translations = json.load(f)
        print(f"Loaded {len(translations)} existing translations from file")
    except Exception as e:
        print("Starting fresh:", e)

# Fetch all questions from Supabase
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_b,option_c,option_d&limit=4000",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    all_q = json.loads(resp.read().decode('utf-8'))

# Filter those that lack English and are not already in translations
to_translate = []
for q in all_q:
    q_id = q['id']
    stem_en = q.get('question_text') or ''
    has_real_en = any('a' <= c.lower() <= 'z' for c in stem_en)
    if not has_real_en and q_id not in translations:
        to_translate.append(q)

print(f"Total to translate now: {len(to_translate)}")

batch_size = 15
total_batches = (len(to_translate) + batch_size - 1) // batch_size

for b_idx in range(total_batches):
    batch = to_translate[b_idx * batch_size : (b_idx + 1) * batch_size]
    items = []
    for q in batch:
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
Keep proper nouns accurately transliterated (e.g. Nayanar, Nallanthuvanar, Bharathiyar).

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
    models_to_try = [
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest"
    ]
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }).encode('utf-8')

    success = False
    for attempt in range(len(models_to_try)):
        m_name = models_to_try[attempt]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={gemini_key}"
        try:
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
                # Also save checkpoint
                with open(dest_path, 'w', encoding='utf-8') as f:
                    json.dump(translations, f, ensure_ascii=False, indent=2)
                print(f"Batch {b_idx + 1}/{total_batches} done with {m_name} ({len(results)} items). Total translated so far: {len(translations)}", flush=True)
                success = True
                break
        except Exception as e:
            print(f"Attempt with {m_name} failed for batch {b_idx + 1}: {e}", flush=True)
            time.sleep(3)

    if not success:
        print(f"FAILED batch {b_idx + 1}", flush=True)
    time.sleep(1)

print(f"ALL DONE! Saved {len(translations)} translations to {dest_path}")
