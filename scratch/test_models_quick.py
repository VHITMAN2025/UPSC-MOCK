import os, sys, json, urllib.request, urllib.error

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()

models_to_test = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite'
]

for m in models_to_test:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={gemini_key}"
    body = json.dumps({"contents": [{"parts": [{"text": "Hello"}]}]}).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"Model {m}: SUCCESS")
    except urllib.error.HTTPError as e:
        print(f"Model {m}: HTTPError {e.code}")
    except Exception as e:
        print(f"Model {m}: {e}")
