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

req = urllib.request.Request(f'{url}/rest/v1/questions?select=id,question_text,question_text_tamil,option_a,option_a_tamil,option_b,option_b_tamil,option_c,option_c_tamil,option_d,option_d_tamil,unit_code,exam_tag,group_name&limit=15', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'Sample questions count: {len(data)}')
        for i, q in enumerate(data):
            print(f'=== Question {i+1} ===')
            print('en_text:', repr(q.get('question_text')))
            print('ta_text:', repr(q.get('question_text_tamil')))
            print('opt_a:', repr(q.get('option_a')), '| opt_a_ta:', repr(q.get('option_a_tamil')))
            print('unit_code:', q.get('unit_code'), '| exam_tag:', q.get('exam_tag'))
except Exception as e:
    print('Error:', e)
