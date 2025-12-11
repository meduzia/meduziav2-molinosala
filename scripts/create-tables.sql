-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ads_performance table
create table if not exists ads_performance (
  id uuid default uuid_generate_v4() primary key,
  ad_id text not null unique,
  ad_name text not null,
  campaign_name text,
  destination text,
  angle text,
  format text,
  impressions integer default 0,
  clicks integer default 0,
  spend numeric(10,2) default 0,
  conversions integer default 0,
  revenue numeric(10,2) default 0,
  ctr numeric(5,2) default 0,
  cpa numeric(10,2) default 0,
  roas numeric(10,2) default 0,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists ads_performance_date_idx on ads_performance(date);
create index if not exists ads_performance_destination_idx on ads_performance(destination);

-- creatives table
create table if not exists creatives (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  file_url text not null,
  file_type text not null,
  angle text,
  destination text,
  format text,
  campaign text,
  status text default 'draft',
  notes text,
  status_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists creatives_status_idx on creatives(status);
create index if not exists creatives_created_at_idx on creatives(created_at);

