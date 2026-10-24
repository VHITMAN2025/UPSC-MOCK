import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixExamNames() {
  console.log('🔧 Fixing exam_name values in papers table...\n')

  // Get all papers
  const { data: papers, error } = await supabase
    .from('papers')
    .select('id, title, exam_name')

  if (error) {
    console.error('❌ Error fetching papers:', error.message)
    return
  }

  console.log(`Found ${papers.length} papers:\n`)

  for (const paper of papers) {
    console.log(`Paper: "${paper.title}"`)
    console.log(`  Current exam_name: "${paper.exam_name}"`)

    let newExamName = paper.exam_name

    // Determine correct exam_name based on title
    const titleLower = paper.title.toLowerCase()
    
    if (titleLower.includes('group-4') || titleLower.includes('group 4')) {
      newExamName = 'TNPSC Group 4'
    } else if (titleLower.includes('group-1') || titleLower.includes('group 1')) {
      newExamName = 'TNPSC Group 1'
    } else if (titleLower.includes('group-2') || titleLower.includes('group 2')) {
      newExamName = 'TNPSC Group 2/2A'
    }

    if (newExamName !== paper.exam_name) {
      console.log(`  ✏️  Updating to: "${newExamName}"`)
      
      const { error: updateError } = await supabase
        .from('papers')
        .update({ exam_name: newExamName })
        .eq('id', paper.id)

      if (updateError) {
        console.error(`  ❌ Error updating:`, updateError.message)
      } else {
        console.log(`  ✅ Updated successfully!`)
      }
    } else {
      console.log(`  ✓ Already correct`)
    }
    console.log('')
  }

  console.log('✅ Done!')
}

fixExamNames()
