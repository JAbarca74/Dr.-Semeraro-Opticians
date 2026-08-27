import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './core/auth/auth.context';
import { IdiomaProvider } from './core/i18n/idioma.context';
import { ThemeProvider } from './core/theme/theme.context';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      {/* El idioma envuelve a la sesión: la pantalla de login ya necesita
          traducirse, y ahí todavía no hay usuario. */}
      <IdiomaProvider>
        <AuthProvider>
        {/* `v7_startTransition` se configura aquí, no en `createBrowserRouter`:
            es el único future flag que consume el proveedor. */}
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AuthProvider>
      </IdiomaProvider>
    </ThemeProvider>
  );
}
