import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
            const cItem = await cookieStore;
            return cItem.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cItem = await cookieStore;
            cItem.set({ name, value, ...options })
          } catch (error) {
            // Check Server Action vs Route Handler usage
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
             const cItem = await cookieStore;
             cItem.set({ name, value: '', ...options })
          } catch (error) {
            // Check Server Action vs Route Handler usage
          }
        },
      },
    }
  )
}
