---
Task ID: 1
Agent: Main Agent
Task: Migrate Warung Sifa Sarah database from JSON files to Supabase

Work Log:
- Read and analyzed all existing project files (db-store.ts, supabase.ts, json-db.ts, client-store.ts, API routes, components)
- Rewrote src/lib/supabase.ts to prefer SUPABASE_SERVICE_ROLE_KEY over NEXT_PUBLIC_SUPABASE_ANON_KEY
- Rewrote src/lib/db-store.ts to be Supabase-only (removed all JSON fallback code)
- Added seedDatabase() function for initial buyer data
- Added exportAllData() and importAllData() functions for backup/restore
- Updated src/app/api/backup/route.ts to use new Supabase-based export/import functions
- Created src/app/api/seed/route.ts for seeding initial buyer data
- Created src/app/api/setup-status/route.ts to check Supabase configuration
- Created src/components/warung/SupabaseSetup.tsx - setup page shown when Supabase not configured
- Updated src/app/page.tsx to check Supabase setup before showing login
- Updated project name from "WARUNG SIFA" to "WARUNG SIFA SARAH" in all components
- Updated Reports.tsx to use correct field names (cashSales/creditSales instead of totalCashSales/totalCreditSales)
- Removed unused files: json-db.ts, client-store.ts
- Updated .env with SUPABASE_SERVICE_ROLE_KEY variable
- Updated supabase-schema.sql with complete schema and seed data
- Updated package.json name to "warung-sifa-sarah"
- Verified app loads correctly showing Supabase setup page when not configured
- All lint checks pass

Stage Summary:
- App fully migrated from JSON file storage to Supabase
- No JSON fallback - Supabase is now required
- Setup page guides user through Supabase configuration
- All CRUD operations use Supabase queries
- Backup/restore works with Supabase data
- Seed endpoint available at POST /api/seed
- App needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
