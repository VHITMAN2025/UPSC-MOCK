import os, sys, json, urllib.request, urllib.error

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={gemini_key}"
prompt = "Hello! Translate 'வணக்கம்' to English. Reply with JSON { \"english\": \"...\" }"
body = json.dumps({
    "contents": [{"parts": [{"text": prompt}]}]
}).encode('utf-8')

req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as resp:
        print("Success:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}: {e.read().decode('utf-8')}")
