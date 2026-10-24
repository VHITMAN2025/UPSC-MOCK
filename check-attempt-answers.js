import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAttemptAnswers() {
  console.log('🔍 Checking attempt_answers data...\n')

  // Get attempts with answers
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select(`
      id,
      status,
      papers (
        id,
        title,
        exam_name
      ),
      attempt_answers (
        id,
        question_id,
        selected_option,
        is_correct
      )
    `)
    .in('status', ['completed', 'submitted'])
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`Found ${attempts.length} attempts:\n`)

  attempts.forEach((att, idx) => {
    const answers = att.attempt_answers || []
    const withSelection = answers.filter(a => a.selected_option != null && a.selected_option !== '').length
    const withoutSelection = answers.filter(a => a.selected_option == null || a.selected_option === '').length

    console.log(`Attempt ${idx + 1}:`)
    console.log(`  Paper: ${att.papers?.title}`)
    console.log(`  Exam: ${att.papers?.exam_name}`)
    console.log(`  Status: ${att.status}`)
    console.log(`  Total answers: ${answers.length}`)
    console.log(`  With selected_option: ${withSelection}`)
    console.log(`  WITHOUT selected_option: ${withoutSelection}`)
    
    if (withoutSelection > 0 && answers.length > 0) {
      console.log(`  Sample answers without selection:`)
      answers.filter(a => !a.selected_option).slice(0, 3).forEach(a => {
        console.log(`    - Q${a.question_id}: selected_option="${a.selected_option}", is_correct=${a.is_correct}`)
      })
    }
    console.log('')
  })
}

checkAttemptAnswers()
