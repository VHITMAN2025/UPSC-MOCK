import os, sys, json, urllib.request

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()

# Note model name format: models/gemini-2.5-flash
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
prompt = """Translate this Tamil TNPSC question and options into clear, high-quality English for examination students. Return JSON with keys: en_question_text, en_option_a, en_option_b, en_option_c, en_option_d.
Question: ‘நான்மணிக்கடிகை’ என்ற நூலை இயற்றிய ஆசிரியரின் இயற்பெயரைச் சுட்டுக.
Option A: நாயனார்
Option B: நல்லந்துவனார்
Option C: நாகனார்
Option D: விளம்பி நாகனார்
"""

body = json.dumps({
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json"}
}).encode('utf-8')

req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    text = res['candidates'][0]['content']['parts'][0]['text']
    print("Gemini Translation Result:")
    print(text)
