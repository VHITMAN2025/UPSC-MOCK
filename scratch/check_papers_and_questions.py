import os
import sys
import json
import urllib.request

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

# 2. Fetch questions sample
req_q = urllib.request.Request(
    f"{supabase_url}/rest/v1/questions?select=id,paper_id,question_number,question_text,question_text_tamil,option_a,option_a_tamil,source_pdf&limit=15",
    headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}
)
with urllib.request.urlopen(req_q) as resp:
    sample_q = json.loads(resp.read().decode('utf-8'))

print("\n--- SAMPLE QUESTIONS ---")
for q in sample_q:
    print(f"Q#{q.get('question_number')} (paper: {q.get('paper_id')}) source_pdf: {q.get('source_pdf')}")
    print(f"  EN text: {repr(q.get('question_text')[:80] if q.get('question_text') else None)}")
    print(f"  TA text: {repr(q.get('question_text_tamil')[:80] if q.get('question_text_tamil') else None)}")
    print(f"  EN opt_a: {repr(q.get('option_a')[:40] if q.get('option_a') else None)}")
    print(f"  TA opt_a: {repr(q.get('option_a_tamil')[:40] if q.get('option_a_tamil') else None)}")
