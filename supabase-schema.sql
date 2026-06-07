-- ============================================
-- WARUNG SIFA - Supabase Schema
-- ============================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- Setelah itu, tambahkan env vars di Vercel/lokal:
--   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
-- ============================================

-- Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'pcs',
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT now(),
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'CASH',
  status TEXT DEFAULT 'PAID',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transaction Items
-- product_id pakai ON DELETE SET NULL supaya produk bisa dihapus tanpa error
-- nama produk tetap tersimpan di product_name
CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS tapi allow semua (pakai service role key)
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and service_role
CREATE POLICY "Allow all on buyers" ON buyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transaction_items" ON transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Seed initial buyers (21 nama pembeli)
INSERT INTO buyers (id, name, phone, address, created_at) VALUES
  ('b01', 'Aikbal', '', '', now()),
  ('b02', 'Adani', '', '', now()),
  ('b03', 'M Jamang', '', '', now()),
  ('b04', 'M Daday', '', '', now()),
  ('b05', 'M Idad', '', '', now()),
  ('b06', 'B Rama', '', '', now()),
  ('b07', 'M Deden', '', '', now()),
  ('b08', 'Om Gozin', '', '', now()),
  ('b09', 'M Tupi', '', '', now()),
  ('b10', 'B Wawan', '', '', now()),
  ('b11', 'M Jae', '', '', now()),
  ('b12', 'M Aris', '', '', now()),
  ('b13', 'M Jop', '', '', now()),
  ('b14', 'M Rudi', '', '', now()),
  ('b15', 'Fadil', '', '', now()),
  ('b16', 'M Gojlag', '', '', now()),
  ('b17', 'Dayat', '', '', now()),
  ('b18', 'M Gareng', '', '', now()),
  ('b19', 'Yuda', '', '', now()),
  ('b20', 'M Andi', '', '', now()),
  ('b21', 'M Asi', '', '', now())
ON CONFLICT (id) DO NOTHING;
