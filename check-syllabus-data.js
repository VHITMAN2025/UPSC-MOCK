import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSyllabusData() {
  console.log('🔍 Checking syllabus analytics data sources...\n')

  // Get the current user (you need to be logged in)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('❌ No user logged in. Please log in first.')
    return
  }

  console.log(`✅ User ID: ${user.id}\n`)

  // Check attempts with paper info
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('id, paper_id, status, papers(id, title, exam_name), attempt_answers(id, question_id, selected_option, is_correct)')
    .eq('user_id', user.id)
    .in('status', ['completed', 'submitted'])

  if (attemptsError) {
    console.log('❌ Error fetching attempts:', attemptsError.message)
  } else {
    console.log(`📝 Found ${attempts.length} completed attempts:\n`)
    attempts.forEach((att, idx) => {
      const answerCount = att.attempt_answers?.length || 0
      console.log(`  ${idx + 1}. Paper: "${att.papers?.title}"`)
      console.log(`     Exam Name: "${att.papers?.exam_name}"`)
      console.log(`     Answers: ${answerCount}`)
      console.log(`     Status: ${att.status}`)
      console.log('')
    })
  }

  // Check quick_recall_sessions
  const { data: recallSessions, error: recallError } = await supabase
    .from('quick_recall_sessions')
    .select('id, exam_context, completed, quick_recall_answers(id)')
    .eq('user_id', user.id)

  if (recallError) {
    console.log('❌ Error fetching recall sessions:', recallError.message)
  } else {
    console.log(`\n🎯 Found ${recallSessions.length} quick recall sessions:\n`)
    recallSessions.forEach((sess, idx) => {
      const answerCount = sess.quick_recall_answers?.length || 0
      console.log(`  ${idx + 1}. Exam Context: "${sess.exam_context}"`)
      console.log(`     Answers: ${answerCount}`)
      console.log(`     Completed: ${sess.completed}`)
      console.log('')
    })
  }

  // Check practice_sessions
  const { data: practiceSessions, error: practiceError } = await supabase
    .from('practice_sessions')
    .select('id, exam_context, status')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  if (practiceError) {
    console.log('❌ Error fetching practice sessions:', practiceError.message)
  } else {
    console.log(`\n📚 Found ${practiceSessions.length} completed practice sessions:\n`)
    practiceSessions.forEach((sess, idx) => {
      console.log(`  ${idx + 1}. Exam Context: "${sess.exam_context}"`)
      console.log(`     Status: ${sess.status}`)
      console.log('')
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY:')
  console.log(`  Total Attempts: ${attempts.length}`)
  console.log(`  Total Recall Sessions: ${recallSessions.length}`)
  console.log(`  Total Practice Sessions: ${practiceSessions.length}`)
  console.log('='.repeat(60))
}

checkSyllabusData()
