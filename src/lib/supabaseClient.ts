import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://njucnjvipbrvtdjruesc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWNuanZpcGJydnRkanJ1ZXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDQxNjIsImV4cCI6MjA5MTQ4MDE2Mn0.8kYYRJW1iLkqwIQ4A89eqSP9FtLjLJYtMQ-nUOtfdkY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);