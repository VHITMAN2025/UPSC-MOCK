import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n')

  const tables = [
    'profiles',
    'papers',
    'attempts',
    'user_streaks',
    'current_affairs',
    'government_notifications',
    'user_notes',
    'exam_sessions'
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`)
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
}

checkDatabase()
