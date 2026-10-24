import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmwfgtnejfblmrmtmebh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtd2ZndG5lamZibG1ybXRtZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjY4ODEsImV4cCI6MjEwNTE0Mjg4MX0.o1PMdy6CytoaJTyZujdOB-DXdGAU3DBWDFbXb4wN6_I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function showColumns() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('Question table columns:')
    console.log(Object.keys(data[0]).join('\n'))
  }
}

showColumns()
