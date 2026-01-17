# InventoryOps - Project Context

## Supabase

- **CLI Access**: Supabase CLI is configured and authenticated for this project
- **Commands**: Use `supabase` CLI directly (e.g., `supabase db push`, `supabase migration up`)
- **Local Dev**: `supabase start` / `supabase stop` for local Supabase instance

## Stack

- Next.js 15 (App Router)
- Supabase (Auth, Database, Storage)
- TypeScript
- Tailwind CSS

## Key Directories

- `src/app/(app)/` - Authenticated app routes
- `src/app/(auth)/` - Auth routes (login, signup)
- `src/sections/` - Feature-specific components
- `src/lib/supabase/` - Supabase client, hooks, types
- `supabase/migrations/` - Database migrations
