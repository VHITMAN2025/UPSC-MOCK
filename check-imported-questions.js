import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkQuestions() {
  console.log('🔍 Checking recently imported questions...\n')

  // Get all questions (sorted by created date)
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.log('❌ Error fetching questions:', error.message)
    return
  }

  console.log(`Found ${questions?.length || 0} recent questions:\n`)
  
  questions?.forEach((q, idx) => {
    console.log(`Question ${idx + 1}:`)
    console.log(`  ID: ${q.id}`)
    console.log(`  Paper ID: ${q.paper_id}`)
    console.log(`  Question Number: ${q.question_number}`)
    console.log(`  Text (EN): ${q.question_text?.substring(0, 80) || 'N/A'}...`)
    console.log(`  Exam Tag: ${q.exam_tag || 'N/A'}`)
    console.log(`  Group Tag: ${q.group_tag || 'N/A'}`)
    console.log(`  Unit Code: ${q.unit_code || 'N/A'}`)
    console.log(`  Macro Topic: ${q.macro_topic || 'N/A'}`)
    console.log(`  Micro Topic: ${q.micro_topic || 'N/A'}`)
    console.log(`  Source Type: ${q.source_type || 'N/A'}`)
    console.log(`  Created: ${q.created_at}`)
    console.log('---')
  })

  // Check paper associations
  console.log('\n📄 Checking papers:')
  const { data: papers } = await supabase
    .from('papers')
    .select('id, title, exam_name, exam_type')
    .order('created_at', { ascending: false })
    .limit(10)

  papers?.forEach(p => {
    console.log(`  - ${p.title} (ID: ${p.id}, Type: ${p.exam_type}, Name: ${p.exam_name})`)
  })
}

checkQuestions()
