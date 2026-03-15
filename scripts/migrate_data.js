require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const data = fs.readFileSync('/tmp/quiz_data_clean.sql', 'utf8');
    
    console.log('Migrating data to Supabase...');
    const { error } = await supabase.rpc('exec_sql', { query: data });
    
    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration successful!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
