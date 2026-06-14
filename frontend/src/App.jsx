import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import POS from './pages/POS.jsx';
import Inventory from './pages/Inventory.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Purchases from './pages/Purchases.jsx';
import Customers from './pages/Customers.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import SaleReturns from './pages/SaleReturns.jsx';
import PurchaseReturns from './pages/PurchaseReturns.jsx';
import Ledgers from './pages/Ledgers.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<ProtectedRoute perm="pos"><POS /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute perm="products"><Products /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute perm="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute perm="customers"><Customers /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute perm="suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="purchases" element={<ProtectedRoute perm="purchases"><Purchases /></ProtectedRoute>} />
        <Route path="sale-returns" element={<ProtectedRoute perm="sale-returns"><SaleReturns /></ProtectedRoute>} />
        <Route path="purchase-returns" element={<ProtectedRoute perm="purchase-returns"><PurchaseReturns /></ProtectedRoute>} />
        <Route path="ledgers" element={<Ledgers />} />
        <Route path="reports" element={<ProtectedRoute perm="reports"><Reports /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
