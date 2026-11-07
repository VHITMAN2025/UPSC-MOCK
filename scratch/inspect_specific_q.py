import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')

url = env.get('VITE_SUPABASE_URL')
key = env.get('VITE_SUPABASE_ANON_KEY')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

req = urllib.request.Request(f'{url}/rest/v1/questions?id=eq.5054cf71-6d22-422f-b5ea-92d929fb331c', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        if data:
            q = data[0]
            print('ID:', q.get('id'))
            print('question_text:', repr(q.get('question_text')))
            print('question_text_tamil:', repr(q.get('question_text_tamil')))
            print('option_a:', repr(q.get('option_a')))
            print('option_a_tamil:', repr(q.get('option_a_tamil')))
            print('source_pdf:', repr(q.get('source_pdf')))
            print('paper_id:', repr(q.get('paper_id')))
except Exception as e:
    print('Error:', e)
