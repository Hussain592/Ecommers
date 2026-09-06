-- Core schema for Dukaan.pk UI Kit (run in Supabase SQL editor)

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  role text NOT NULL DEFAULT 'customer', -- customer|vendor|partner|admin
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  price numeric NOT NULL,
  stock int NOT NULL DEFAULT 0,
  category text,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id text PRIMARY KEY,
  customer_name text,
  phone text,
  city text,
  total numeric,
  status text DEFAULT 'Pending',
  items jsonb,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Simple indexes
CREATE INDEX ON products (category);
CREATE INDEX ON products (vendor_id);
CREATE INDEX ON orders (status);
