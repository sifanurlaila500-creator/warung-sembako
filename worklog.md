---
Task ID: 1
Agent: main
Task: Add delete functionality to Hutang (Debts) section and fix product deletion error

Work Log:
- Read Debts.tsx, Products.tsx, db-store.ts, API routes to understand current implementation
- Added `deletePayment()` function in db-store.ts that reverses payment effects on transactions before deleting
- Created new API route `/api/payments/[id]/route.ts` for DELETE payment endpoint
- Updated Debts.tsx to include delete buttons (trash icon) in each ledger entry row with "Aksi" column
- Added delete confirmation dialogs for both debt entries and payment entries
- Fixed `deleteProduct()` in db-store.ts to be more robust with multi-step fallback approach
- All changes verified with `bun run lint` - no errors
- API endpoints tested via curl - buyers, products, payments all return data correctly

Stage Summary:
- Debts page now has delete buttons for each hutang and payment entry
- Deleting a hutang entry calls DELETE /api/transactions/{id} (restores stock)
- Deleting a payment entry calls DELETE /api/payments/{id} (reverses payment on transactions)
- Product deletion improved with fallback logic to handle foreign key constraint issues
- New file created: src/app/api/payments/[id]/route.ts
- Modified files: src/lib/db-store.ts, src/components/warung/Debts.tsx
