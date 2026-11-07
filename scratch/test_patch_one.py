import os, sys, json, urllib.request

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.getcwd(), '.env')
supabase_url = None
supabase_key = None

with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('VITE_SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip()
        elif line.startswith('VITE_SUPABASE_ANON_KEY='):
            supabase_key = line.split('=', 1)[1].strip()

# Fetch 1 question
req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,question_text,question_text_tamil&limit=1",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req) as resp:
    q = json.loads(resp.read().decode('utf-8'))[0]

print("Before:", q)

body = json.dumps({"question_text": "What is the state tree of Tamil Nadu?"}).encode('utf-8')
patch_req = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?id=eq.{q['id']}",
    data=body,
    headers={
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    },
    method="PATCH"
)
try:
    with urllib.request.urlopen(patch_req) as p_resp:
        res = json.loads(p_resp.read().decode('utf-8'))
        print("After PATCH:", res)
except Exception as e:
    print("PATCH error:", e)
