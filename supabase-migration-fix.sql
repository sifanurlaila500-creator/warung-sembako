-- ============================================
-- WARUNG SIFA - Migration Fix
-- ============================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- Kalau kamu sudah punya tabel dari schema sebelumnya,
-- jalankan ini untuk memperbaiki foreign key constraints
-- ============================================

-- Fix 1: Ubah foreign key transaction_items.product_id jadi ON DELETE SET NULL
-- (supaya produk bisa dihapus tanpa error, nama produk tetap tersimpan di product_name)
ALTER TABLE transaction_items 
  DROP CONSTRAINT IF EXISTS transaction_items_product_id_fkey;

ALTER TABLE transaction_items 
  ADD CONSTRAINT transaction_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Fix 2: Ubah foreign key payments.transaction_id jadi ON DELETE SET NULL
-- (supaya transaksi bisa dihapus tanpa error, payment tetap tersimpan)
ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_transaction_id_fkey;

ALTER TABLE payments 
  ADD CONSTRAINT payments_transaction_id_fkey 
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- Fix 3: Set product_id ke NULL kalau isinya string kosong (bukan valid foreign key)
UPDATE transaction_items SET product_id = NULL WHERE product_id = '';
