import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zvjwbyujkajtvqbcisco.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2andieXVqa2FqdHZxYmNpc2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTUyMDgsImV4cCI6MjA4NTIzMTIwOH0.7QPHmgnrmKyz_k2ZQFGqnu38eXK2fuC0hnlq7diKv2s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
