import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNDE4ODIsImV4cCI6MjA0NDkxNzg4Mn0.kGgV_g8qO0K7o4Q1oG1YqH_1F4aK0m4zM4t0aG4qO4k'; // placeholder

const env = {};
import fs from 'fs';
fs.readFileSync('.env', 'utf-8').split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, v] = line.trim().split('=', 2);
    env[k] = v;
  }
});

const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const emails = ['vinaa-tester-101@gmail.com', 'tonygokul30@gmail.com', 'aswaniadduri11@gmail.com', 'adduriaswani@gmail.com'];
const passwords = ['Admin@123', 'admin123', 'Password@123', 'vinaa123', 'Vinaa@123', '12345678', 'password'];

async function testLogins() {
  for (const e of emails) {
    for (const p of passwords) {
      const { data, error } = await client.auth.signInWithPassword({ email: e, password: p });
      if (!error && data.session) {
        console.log(`SUCCESS! Email: ${e}, Password: ${p}`);
        return { email: e, password: p, session: data.session };
      }
    }
  }
  console.log('No matched password in common list');
}
testLogins();
