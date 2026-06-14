import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './core/auth/auth.context';
import { ThemeProvider } from './core/theme/theme.context';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
