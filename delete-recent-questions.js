import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function deleteRecentQuestions() {
  console.log('🗑️  Finding recently created questions (last 15 minutes)...\n')

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { data: recentQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('id, question_number, question_text, created_at')
    .gte('created_at', fifteenMinutesAgo)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.log('❌ Error:', fetchError.message)
    return
  }

  console.log(`Found ${recentQuestions?.length || 0} questions:\n`)
  
  recentQuestions?.forEach((q, idx) => {
    const text = q.question_text || '(no text)'
    console.log(`  ${idx + 1}. Q${q.question_number}: ${text.substring(0, 50)}... (${q.created_at})`)
  })

  if (recentQuestions && recentQuestions.length > 0) {
    console.log(`\n⚠️  DELETE ${recentQuestions.length} questions? (wait 3 sec or Ctrl+C to cancel)\n`)
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const ids = recentQuestions.map(q => q.id)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.log('❌ Error:', deleteError.message)
    } else {
      console.log(`✅ Deleted ${recentQuestions.length} questions!`)
    }
  } else {
    console.log('\n✅ No recent questions found.')
  }
}

deleteRecentQuestions()
