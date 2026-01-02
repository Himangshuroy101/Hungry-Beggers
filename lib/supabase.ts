import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neecqiseeqhcisxxjgou.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZWNxaXNlZXFoY2lzeHhqZ291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzQyNTUsImV4cCI6MjA4MjE1MDI1NX0.XWrgciZ0D9rBdBVHTVKom9KLoTbkvwC6faJzemFId3Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});