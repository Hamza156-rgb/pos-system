// Screens an admin can grant to a cashier (per-screen toggles).
// Admin-only screens (Users, Settings, Audit Logs) are intentionally NOT grantable.
// Keys must match the route paths and the backend requirePermission() keys.
export const GRANTABLE_SCREENS = [
  { key: 'pos', label: 'POS / Sales' },
  { key: 'products', label: 'Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'sale-returns', label: 'Sale Returns' },
  { key: 'purchase-returns', label: 'Purchase Returns' },
  { key: 'reports', label: 'Reports' },
];

// Sensible defaults checked when creating a new cashier.
export const DEFAULT_CASHIER_PERMISSIONS = ['pos', 'products', 'inventory', 'customers'];
