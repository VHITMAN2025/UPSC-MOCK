import os, sys, json, urllib.request, urllib.error

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()

# Test Gemini 3.1 Flash Lite batch translation
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={gemini_key}"
prompt = """You are an expert bilingual TNPSC exam translator.
Translate each Tamil question and options into clear, high-quality, professional English suitable for competitive exams.
Questions to translate:
[
  {
    "id": 1,
    "question": "பிழையான தொடரைக் கண்டறிக.",
    "option_a": "காளைகளைப் பூட்டி வயலை உழுதனர்",
    "option_b": "மலை மீது ஏறிப் பார்த்தான்",
    "option_c": "அவன் நேற்று வந்தான்",
    "option_d": "அவன் பாடம் படித்தார்"
  },
  {
    "id": 2,
    "question": "'செற்றம்' என்ற சொல்லின் எதிர்ச்சொல்லைக் கண்டறிக.",
    "option_a": "பகை",
    "option_b": "நட்பு",
    "option_c": "சினம்",
    "option_d": "வெறுப்பு"
  }
]

Return strictly a JSON array with schema:
[
  {
    "id": 1,
    "en_question_text": "Identify the incorrect sentence.",
    "en_option_a": "They yoked bulls and ploughed the field",
    "en_option_b": "He climbed the mountain and looked",
    "en_option_c": "He came yesterday",
    "en_option_d": "He read the lesson (grammatically mismatched honorific)"
  }
]
"""

body = json.dumps({
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}
}).encode('utf-8')

req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Gemini 3.1 Flash Lite Translation:")
    print(data['candidates'][0]['content']['parts'][0]['text'])
