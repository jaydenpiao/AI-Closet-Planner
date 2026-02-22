# Supabase Migration Runbook (Closet Planner AI v2)

## Goal

Safely apply auth/closet/saved-outfit schema and policies with minimal break risk.

## Migration File

- `supabase/migrations/20260221143000_auth_closet_v1.sql`

This migration creates:

1. `public.profiles`
2. `public.closet_items`
3. `public.saved_outfits`
4. RLS policies for all new tables
5. Storage bucket `closet-item-images`
6. Storage object policies scoped by user folder prefix

## Recommended Workflow

1. Create and validate on a Supabase development branch.
2. Run policy checks and smoke tests.
3. Merge branch to main project.

If branch tooling is unavailable in your environment, apply migration directly to the project only after confirming a backup/snapshot.

## Apply Migration (MCP)

Use `apply_migration` with:

- `name`: `auth_closet_v1`
- `query`: contents of migration SQL file

## Verify Schema

Check tables:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'closet_items', 'saved_outfits')
order by table_name;
```

Check bucket:

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'closet-item-images';
```

Check policies:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public', 'storage')
  and (tablename in ('profiles', 'closet_items', 'saved_outfits') or tablename = 'objects')
order by schemaname, tablename, policyname;
```

## App Smoke Checklist

1. Guest flow still works:
   - `/api/health`
   - `/api/analyze-closet`
   - `/api/generate-outfits`
2. Auth flow works:
   - email/password sign-up/sign-in
   - Google OAuth sign-in
3. Protected flow works:
   - `/api/me`
   - `/api/me/closet-items` CRUD
   - item image upload/delete
   - `/api/me/generate-outfits`
   - `/api/me/saved-outfits` create/list/delete

Google provider setup details (for local OAuth): `docs/GOOGLE_OAUTH_LOCAL_SETUP.md`

## Rollback Guidance

For hackathon speed, no down migration is included.  
If rollback is needed:

1. Restore from Supabase backup/snapshot, or
2. Manually drop created tables/policies/bucket objects in reverse order.
