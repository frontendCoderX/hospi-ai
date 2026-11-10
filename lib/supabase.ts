// Server only: importing this file from a client component fails the build.
// The browser never talks to Supabase; it asks our server instead.
import "server-only"

import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
)
