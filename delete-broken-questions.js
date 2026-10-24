import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function deleteBrokenQuestions() {
  console.log('🗑️  Finding questions with NULL taxonomy data...\n')

  // Find questions with NULL group_tag (these are broken from the CSV import)
  const { data: brokenQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('id, question_number, created_at, group_tag, unit_code, macro_topic')
    .is('group_tag', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (fetchError) {
    console.log('❌ Error fetching questions:', fetchError.message)
    return
  }

  console.log(`Found ${brokenQuestions?.length || 0} questions with NULL group_tag:\n`)
  
  brokenQuestions?.forEach((q, idx) => {
    console.log(`  ${idx + 1}. Q${q.question_number} (ID: ${q.id}, Created: ${q.created_at})`)
  })

  if (brokenQuestions && brokenQuestions.length > 0) {
    console.log(`\n⚠️  About to DELETE ${brokenQuestions.length} broken questions...`)
    console.log('Press Ctrl+C now if you want to cancel, or wait 3 seconds...\n')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const ids = brokenQuestions.map(q => q.id)
    const { data: deleted, error: deleteError } = await supabase
      .from('questions')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.log('❌ Error deleting questions:', deleteError.message)
    } else {
      console.log(`✅ Successfully deleted ${brokenQuestions.length} broken questions!`)
      console.log('\nYou can now re-upload your CSV with the fix applied.')
    }
  } else {
    console.log('\n✅ No broken questions found!')
  }
}

deleteBrokenQuestions()
