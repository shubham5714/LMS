import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a browser-compatible Supabase client instance that works with SSR
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

// Export the client as default for convenience
export default supabase
