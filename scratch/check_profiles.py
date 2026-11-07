import urllib.request
import json

env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')

url = env.get('VITE_SUPABASE_URL')
key = env.get('VITE_SUPABASE_ANON_KEY')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

req = urllib.request.Request(f'{url}/rest/v1/profiles?select=id,email,full_name,role', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'Total profiles: {len(data)}')
        for p in data:
            print(p)
except Exception as e:
    print('Error:', e)
