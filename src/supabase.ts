import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://breuefejkgcftbkxqyma.supabase.co"
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXVlZmVqa2djZnRia3hxeW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTk0OTcsImV4cCI6MjA2NTk3NTQ5N30.z7mxaYL46w2v7AoaWtcdFuuijVzEI3qsrAMT-E3v_I8'


export const supabase = createClient(supabaseUrl,supabaseKey)