import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
