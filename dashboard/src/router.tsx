import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout';
import AuthGuard from './components/auth-guard';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import InventoryPage from './pages/inventory';
import OrdersPage from './pages/orders';
import CreditPage from './pages/credit';
import ProfilePage from './pages/profile';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'credit', element: <CreditPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
