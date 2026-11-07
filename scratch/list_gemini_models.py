import os, sys, json, urllib.request

env_path = os.path.join(os.getcwd(), '.env')
gemini_key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_GEMINI_API_KEY='):
            gemini_key = line.split('=', 1)[1].strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    for m in res.get('models', []):
        if 'generateContent' in m.get('supportedGenerationMethods', []):
            print(m['name'], m.get('supportedGenerationMethods'))
