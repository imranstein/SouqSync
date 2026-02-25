import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { I18nProvider } from './contexts/i18n-context';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </AuthProvider>
  );
}
