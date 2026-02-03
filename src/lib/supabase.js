import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING')
console.log('Supabase Key:', supabaseAnonKey ? 'Present (' + supabaseAnonKey.length + ' chars)' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Test query on load
supabase.from('profiles').select('count').limit(1).then(result => {
  console.log('Supabase test query result:', result)
}).catch(err => {
  console.error('Supabase test query error:', err)
})
