-- BGrowth Commerce — Orders & Access schema
--
-- Scope: only Orders and Access move to Supabase (see ARCHITECTURE.md's
-- "Payment completion pipeline"). Products, Product Packages, Builders,
-- and Workspaces are unaffected and stay on their current data sources.
--
-- Run this once in your Supabase project's SQL editor before setting
-- SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (see .env.example). Both
-- tables are written and read exclusively through
-- SupabaseOrderRepository / SupabaseAccessRepository using the service
-- role key — Row Level Security is enabled with no policies, so the
-- anon/public key (if ever used) has zero access by default.

create table if not exists orders (
  id text primary key,
  member_id text not null,
  items jsonb not null,
  purchases jsonb not null default '[]'::jsonb,
  subtotal jsonb not null,
  discount_total jsonb not null,
  tax_total jsonb not null,
  total jsonb not null,
  status text not null,
  created_at timestamptz not null,
  transaction_id text
);

create index if not exists orders_member_id_idx on orders (member_id);

alter table orders enable row level security;

create table if not exists product_access (
  member_id text not null,
  product_id text not null,
  has_access boolean not null,
  source text not null,
  granted_at timestamptz not null,
  expires_at timestamptz,
  primary key (member_id, product_id)
);

alter table product_access enable row level security;
