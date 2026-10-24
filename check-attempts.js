import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAttempts() {
  console.log('🔍 Checking attempts and papers data...\n')

  // Get all attempts with paper info
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select(`
      id,
      user_id,
      paper_id,
      status,
      papers (
        id,
        title,
        exam_type,
        subject,
        year
      )
    `)
    .limit(10)

  if (error) {
    console.log('❌ Error fetching attempts:', error.message)
    return
  }

  console.log(`Found ${attempts?.length || 0} attempts:\n`)
  
  attempts?.forEach((attempt, idx) => {
    console.log(`Attempt ${idx + 1}:`)
    console.log(`  User ID: ${attempt.user_id}`)
    console.log(`  Paper: ${attempt.papers?.title || 'N/A'}`)
    console.log(`  Exam Type: ${attempt.papers?.exam_type || 'N/A'}`)
    console.log(`  Subject: ${attempt.papers?.subject || 'N/A'}`)
    console.log(`  Year: ${attempt.papers?.year || 'N/A'}`)
    console.log(`  Status: ${attempt.status}`)
    console.log('---')
  })

  // Check papers table
  const { data: papers } = await supabase
    .from('papers')
    .select('id, title, exam_type, subject, year')
    .limit(10)

  console.log(`\n📄 Papers in database:`)
  papers?.forEach(p => {
    console.log(`  - ${p.title} (${p.exam_type}, ${p.subject}, ${p.year})`)
  })
}

checkAttempts()
